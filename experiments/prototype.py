import csv
import random
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import argparse


# -------------------------
# Data loading
# -------------------------

def read_csv(filename):
    """
    Reads guest data from a CSV file into a list of dicts.
    Expects columns:
      - Name
      - Gender
      - Marital_Status
      - Wants to sit next to
      - Must not sit next to
    """
    people = []
    with open(filename, mode='r', newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            people.append(row)
    return people


# -------------------------
# Relationship helpers
# -------------------------

def is_married_to(person1, person2):
    return (
        f"Married to {person2['Name']}" in person1.get('Marital_Status', '') or
        f"Married to {person1['Name']}" in person2.get('Marital_Status', '')
    )


# -------------------------
# Per-table seating from pools
# -------------------------

def build_table_seating(males_pool, females_pool, table_size):
    """
    Take from the shared male/female pools and build a single table's seating
    list with as close to gender alternation as possible.
    Mutates males_pool and females_pool.

    table_size is the actual size of this table (<= max table_capacity),
    not the global capacity.
    """
    total_remaining = len(males_pool) + len(females_pool)
    if total_remaining < table_size:
        return None

    # Aim for a male/female split proportional to what's left
    if total_remaining > 0:
        ideal_males = int(round(table_size * len(males_pool) / total_remaining))
    else:
        ideal_males = 0

    ideal_males = min(ideal_males, len(males_pool))
    ideal_females = table_size - ideal_males

    # If not enough of one gender, top up with the other
    if ideal_females > len(females_pool):
        ideal_females = len(females_pool)
        ideal_males = min(table_size - ideal_females, len(males_pool))
    if ideal_males > len(males_pool):
        ideal_males = len(males_pool)
        ideal_females = min(table_size - ideal_males, len(females_pool))

    if ideal_males + ideal_females < table_size:
        # Still short; fill greedily from whichever pool has more
        needed = table_size - (ideal_males + ideal_females)
        for _ in range(needed):
            if len(males_pool) >= len(females_pool) and males_pool:
                ideal_males += 1
            elif females_pool:
                ideal_females += 1

        if ideal_males > len(males_pool) or ideal_females > len(females_pool):
            return None

    # Pull the people out of the pools
    local_males = [males_pool.pop() for _ in range(ideal_males)]
    local_females = [females_pool.pop() for _ in range(ideal_females)]

    # Now alternate genders within this table
    seating = []
    male_turn = len(local_males) >= len(local_females)

    while local_males or local_females:
        if male_turn and local_males:
            seating.append(local_males.pop())
        elif (not male_turn) and local_females:
            seating.append(local_females.pop())
        elif local_males:
            seating.append(local_males.pop())
        elif local_females:
            seating.append(local_females.pop())
        male_turn = not male_turn

    return seating


# -------------------------
# Scoring helpers
# -------------------------

def ensure_no_adjacent_couples(table):
    """
    Try to rearrange a single table so that no married couple sits adjacent
    in the circular ordering.
    """
    n = len(table)
    for i in range(n):
        if is_married_to(table[i], table[(i + 1) % n]):
            for j in range(2, n):
                a = (i + j) % n
                b = (i + j + 1) % n
                if (not is_married_to(table[i], table[a]) and
                        not is_married_to(table[(i + 1) % n], table[b])):
                    table[(i + 1) % n], table[a] = table[a], table[(i + 1) % n]
                    break
    return table


def valid_alternating_seating(table):
    """
    Returns True if genders alternate for all adjacent seats around the table
    (circular).
    """
    n = len(table)
    if n <= 1:
        return True
    for i in range(n):
        if table[i]['Gender'] == table[(i + 1) % n]['Gender']:
            return False
    return True


def count_adjacent_singles(table):
    n = len(table)
    if n == 0:
        return 0
    count = 0
    for i in range(n):
        if (table[i]['Marital_Status'] == 'Single' and
                table[(i + 1) % n]['Marital_Status'] == 'Single'):
            count += 1
    return count


def count_split_couples(seating1, seating2):
    """
    Counts the number of unique married couples that are split across two tables.
    """
    split_couples = set()
    for person1 in seating1:
        for person2 in seating2:
            if is_married_to(person1, person2):
                pair = tuple(sorted((person1['Name'], person2['Name'])))
                split_couples.add(pair)
    return len(split_couples)


def count_wants_score(seating):
    wants_score = 0
    n = len(seating)
    for i in range(n):
        person = seating[i]
        wants_to_sit_next_to = person.get('Wants to sit next to', '').strip()
        if wants_to_sit_next_to:
            next_person = seating[(i + 1) % n]
            prev_person = seating[(i - 1) % n]
            if (next_person['Name'] == wants_to_sit_next_to or
                    prev_person['Name'] == wants_to_sit_next_to):
                wants_score += 1
    return wants_score


def count_must_not_violations(seating):
    must_not_violations = 0
    n = len(seating)
    for i in range(n):
        person = seating[i]
        must_not_sit_next_to = person.get('Must not sit next to', '').strip()
        if must_not_sit_next_to:
            next_person = seating[(i + 1) % n]
            prev_person = seating[(i - 1) % n]
            if (next_person['Name'] == must_not_sit_next_to or
                    prev_person['Name'] == must_not_sit_next_to):
                must_not_violations += 1
    return must_not_violations


def count_same_gender_adjacencies(table):
    """
    Counts the number of adjacent same-gender pairs (MM or FF)
    around a circular table.
    """
    n = len(table)
    if n == 0:
        return 0
    count = 0
    for i in range(n):
        if table[i]['Gender'] == table[(i + 1) % n]['Gender']:
            count += 1
    return count


def scoring_tuple(total_must_not_violations,
                  total_wants_score,
                  alternating_seating_score,
                  split_couples,
                  total_adjacent_singles):
    """
    Priority (updated):
      1. Minimise must-not violations
      2. Maximise wants satisfied
      3. Maximise adjacent singles (singles together)
      4. Maximise alternating tables
      5. Maximise split couples
    """
    return (
        total_must_not_violations,   # 1. minimise must-not violations
        -total_wants_score,          # 2. maximise wants (if any)
        -total_adjacent_singles,     # 3. maximise single–single neighbours
        -alternating_seating_score,  # 4. maximise alternating tables
        -split_couples,              # 5. maximise split couples
    )


# -------------------------
# Main seating arrangement
# -------------------------

def arrange_seating(people, table_capacity, num_tables, attempts=1000, verbose=False):
    males_all = [p for p in people if p.get('Gender') == 'Male']
    females_all = [p for p in people if p.get('Gender') == 'Female']

    singles = [p for p in people if p.get('Marital_Status') == 'Single']
    married = [p for p in people if p.get('Marital_Status') != 'Single']

    total_guests = len(people)
    total_capacity = table_capacity * num_tables

    if total_guests > total_capacity:
        print(
            f"Error: {total_guests} guests but only {total_capacity} seats "
            f"({num_tables} × {table_capacity})."
        )
        return [[] for _ in range(num_tables)]

    # Decide actual table sizes so everyone is seated.
    base_size = total_guests // num_tables
    extra = total_guests % num_tables
    table_sizes = [base_size + (1 if i < extra else 0) for i in range(num_tables)]

    if any(size > table_capacity for size in table_sizes):
        print("Error: cannot fit guests into tables without exceeding capacity.")
        return [[] for _ in range(num_tables)]

    if verbose:
        print(f"Total guests: {total_guests}")
        print(f"Total males: {len(males_all)}")
        print(f"Total females: {len(females_all)}")
        print(f"Total singles: {len(singles)}")
        print(f"Total married: {len(married)}")
        print(f"Table sizes (<= {table_capacity}): {table_sizes}")

    best_seating = [[] for _ in range(num_tables)]
    best_score = None
    best_metrics = {
        'split_couples': -1,
        'adjacent_singles': -1,
        'same_gender_adjacent': -1,
        'wants_score': -1,
        'must_not_violations': float('inf'),
        'alternating_seating_score': -1,
    }
    attempts_made = 0

    for attempt in range(1, attempts + 1):
        attempts_made += 1
        males = males_all[:]
        females = females_all[:]
        random.shuffle(males)
        random.shuffle(females)

        if verbose:
            print(f"\nAttempt {attempt}: distributing guests to tables")

        seatings = []
        success = True

        for size in table_sizes:
            table = build_table_seating(males, females, size)
            if table is None or len(table) != size:
                success = False
                if verbose:
                    print(f"  Could not build table of size {size}; restarting attempt.")
                break
            seatings.append(table)

        if not success:
            continue

        adjusted_seatings = [ensure_no_adjacent_couples(table[:]) for table in seatings]

        total_adjacent_singles = sum(count_adjacent_singles(s) for s in adjusted_seatings)
        split_couples = sum(
            count_split_couples(s, other)
            for i, s in enumerate(adjusted_seatings)
            for other in adjusted_seatings[i + 1:]
        )
        alternating_seating_score = sum(
            1 if valid_alternating_seating(s) else 0
            for s in adjusted_seatings
        )
        total_wants_score = sum(count_wants_score(s) for s in adjusted_seatings)
        total_must_not_violations = sum(count_must_not_violations(s) for s in adjusted_seatings)
        same_gender_adjacent = sum(
            count_same_gender_adjacencies(s) for s in adjusted_seatings
        )

        current_score = scoring_tuple(
            total_must_not_violations,
            total_wants_score,
            alternating_seating_score,
            split_couples,
            total_adjacent_singles
        )

        if verbose:
            print(
                f"  Wants score: {total_wants_score}, "
                f"Must-not violations: {total_must_not_violations}, "
                f"Alternating tables: {alternating_seating_score}, "
                f"Split couples: {split_couples}, "
                f"Adjacent singles: {total_adjacent_singles}, "
                f"Same-gender adjacencies: {same_gender_adjacent}"
            )

        if best_score is None or current_score < best_score:
            best_score = current_score
            best_seating = adjusted_seatings
            best_metrics = {
                'split_couples': split_couples,
                'adjacent_singles': total_adjacent_singles,
                'same_gender_adjacent': same_gender_adjacent,
                'wants_score': total_wants_score,
                'must_not_violations': total_must_not_violations,
                'alternating_seating_score': alternating_seating_score,
            }

    if any(best_seating):
        print(
            f"Best arrangement found after {attempts_made} attempts with "
            f"{best_metrics['split_couples']} split couples, "
            f"{best_metrics['adjacent_singles']} adjacent singles, "
            f"{best_metrics['same_gender_adjacent']} same-gender adjacencies, "
            f"{best_metrics['wants_score']} wants satisfied, "
            f"{best_metrics['must_not_violations']} must-not violations, "
            f"and {best_metrics['alternating_seating_score']} tables with alternating seating!"
        )
    else:
        print(f"No valid arrangement found after {attempts} attempts.")

    return best_seating


# -------------------------
# Plotting
# -------------------------

def plot_tables(tables, table_shape, table_capacity):
    num_tables = len(tables)
    fig, axes = plt.subplots(1, num_tables, figsize=(8 * num_tables, 8))
    if num_tables == 1:
        axes = [axes]

    def plot_table(ax, table, table_number):
        ax.set_aspect('equal')

        if table_shape == 'round':
            theta = np.linspace(0, 2 * np.pi, table_capacity, endpoint=False)
            x_base = 1.75 * np.cos(theta)
            y_base = 1.75 * np.sin(theta)
            ax.set_xlim(-2, 2)
            ax.set_ylim(-2, 2)
        else:  # 'trestle'
            half = table_capacity // 2
            x_top = np.linspace(-3, 3, half)
            x_bottom = np.linspace(3, -3, half)
            x_base = np.concatenate([x_top, x_bottom])
            y_base = np.array([1] * half + [-1] * half)
            ax.set_xlim(-4, 4)
            ax.set_ylim(-4, 4)

        n = len(table)
        x = x_base[:n]
        y = y_base[:n]

        ax.axis('off')

        for i, person in enumerate(table):
            name_gender = f"{person['Name']}\n({person['Gender']})"
            marital_status = person.get('Marital_Status', '')
            if "Married" in marital_status:
                name_gender += f"\n{marital_status}"
            ax.text(
                x[i], y[i], name_gender,
                ha='center', va='center',
                bbox=dict(facecolor='white', alpha=0.5),
                fontsize=10
            )

        if table_shape == 'round':
            ax.add_patch(plt.Circle((0, 0), 1.75, color='lightblue', alpha=0.5))
        else:
            ax.add_patch(plt.Rectangle((-3.5, -1.5), 7, 3, color='lightblue', alpha=0.5))

        ax.text(0, 0, f'Table {table_number}', ha='center', va='center', fontsize=14, weight='bold')

    for i, table in enumerate(tables):
        plot_table(axes[i], table, i + 1)

    plt.suptitle('Seating Plan for Tables', fontsize=16)
    plt.show()


# -------------------------
# DataFrame + console table
# -------------------------

def output_to_dataframe(tables):
    """
    Build a DataFrame showing each table's guests and marital status.
    Columns are padded so all have the same length.
    """
    max_len = max(len(t) for t in tables)
    data = {}

    for i, table in enumerate(tables):
        names_col = []
        status_col = []
        for person in table:
            names_col.append(f"{person['Name']} ({person['Gender']})")
            status_col.append(person.get('Marital_Status', ''))
        # pad to max_len
        while len(names_col) < max_len:
            names_col.append('')
            status_col.append('')
        data[f'Table {i + 1}'] = names_col
        data[f'Marital Status {i + 1}'] = status_col

    df = pd.DataFrame(data)
    return df


def print_table_plan(tables):
    """
    Print a more detailed tabular plan to the console, including
    left/right neighbours for each seat, to help debugging.
    """
    for t_idx, table in enumerate(tables, start=1):
        print(f"\n=== Table {t_idx} ===")
        rows = []
        n = len(table)
        for i, person in enumerate(table):
            left_person = table[(i - 1) % n]
            right_person = table[(i + 1) % n]
            rows.append({
                "Seat": i,
                "Name": person['Name'],
                "Gender": person['Gender'],
                "Marital_Status": person.get('Marital_Status', ''),
                "Left neighbour": left_person['Name'],
                "Right neighbour": right_person['Name'],
            })
        df = pd.DataFrame(rows)
        print(df.to_string(index=False))


# -------------------------
# CLI
# -------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Seating arrangement for an event.')
    parser.add_argument('--filename', type=str, default='people.csv', help='CSV file with guest information')
    parser.add_argument('--table_shape', type=str, choices=['round', 'trestle'], default='round', help='Shape of the tables')
    parser.add_argument('--table_capacity', type=int, default=12, help='Maximum number of people each table can seat')
    parser.add_argument('--num_tables', type=int, default=2, help='Number of tables available')
    parser.add_argument('--attempts', type=int, default=1000, help='Number of random attempts to try')
    parser.add_argument('--verbose', action='store_true', help='Print detailed debug output')

    args = parser.parse_args()
    people = read_csv(args.filename)

    if len(people) < 4:
        print("Not enough people in the CSV file. Please ensure there are at least 4 people.")
    else:
        tables = arrange_seating(
            people,
            args.table_capacity,
            args.num_tables,
            attempts=args.attempts,
            verbose=args.verbose
        )

        if any(tables):
            # Plot
            plot_tables(tables, args.table_shape, args.table_capacity)

            # Simple DataFrame overview
            df = output_to_dataframe(tables)
            print("\nSimple table overview:")
            print(df)

            # Detailed console plan with neighbours
            print_table_plan(tables)
        else:
            print(
                f"Could not find a valid seating arrangement that satisfies the constraints "
                f"after {args.attempts} attempts."
            )
