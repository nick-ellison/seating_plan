import csv
import random
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import argparse

def read_csv(filename):
    people = []
    with open(filename, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            people.append(row)
    return people

def is_married_to(person1, person2):
    return (f"Married to {person2['Name']}" in person1['Marital_Status']) or (f"Married to {person1['Name']}" in person2['Marital_Status'])

def alternate_gender_seating(males, females, count):
    seating = []
    male_turn = True if len(males) >= len(females) else False
    while len(seating) < count and (males or females):
        if male_turn and males:
            seating.append(males.pop(0))
        elif females:
            seating.append(females.pop(0))
        male_turn = not male_turn
    while len(seating) < count and males:
        seating.append(males.pop(0))
    while len(seating) < count and females:
        seating.append(females.pop(0))
    return seating

def ensure_no_adjacent_couples(table):
    for i in range(len(table)):
        if is_married_to(table[i], table[(i + 1) % len(table)]):
            for j in range(2, len(table)):
                if not is_married_to(table[i], table[(i + j) % len(table)]) and not is_married_to(table[(i + 1) % len(table)], table[(i + j + 1) % len(table)]):
                    table[(i + 1) % len(table)], table[(i + j) % len(table)] = table[(i + j) % len(table)], table[(i + 1) % len(table)]
                    break
    return table

def valid_alternating_seating(table):
    for i in range(len(table) - 1):
        if table[i]['Gender'] == table[i + 1]['Gender']:
            return False
    return True

def count_adjacent_singles(table):
    if not table:
        return 0
    count = 0
    for i in range(len(table) - 1):
        if table[i]['Marital_Status'] == 'Single' and table[i + 1]['Marital_Status'] == 'Single':
            count += 1
    if table[-1]['Marital_Status'] == 'Single' and table[0]['Marital_Status'] == 'Single':
        count += 1
    return count

def count_split_couples(seating1, seating2):
    split_count = 0
    for person1 in seating1:
        for person2 in seating2:
            if is_married_to(person1, person2):
                split_count += 1
    return split_count

def count_wants_score(seating):
    wants_score = 0
    for i in range(len(seating)):
        person = seating[i]
        wants_to_sit_next_to = person['Wants to sit next to']
        if wants_to_sit_next_to:
            next_person = seating[(i + 1) % len(seating)]
            prev_person = seating[(i - 1) % len(seating)]
            if next_person['Name'] == wants_to_sit_next_to or prev_person['Name'] == wants_to_sit_next_to:
                wants_score += 1
    return wants_score

def count_must_not_violations(seating):
    must_not_violations = 0
    for i in range(len(seating)):
        person = seating[i]
        must_not_sit_next_to = person['Must not sit next to']
        if must_not_sit_next_to:
            next_person = seating[(i + 1) % len(seating)]
            prev_person = seating[(i - 1) % len(seating)]
            if next_person['Name'] == must_not_sit_next_to or prev_person['Name'] == must_not_sit_next_to:
                must_not_violations += 1
    return must_not_violations

def arrange_seating(people, table_capacity, num_tables):
    males = [person for person in people if person['Gender'] == 'Male']
    females = [person for person in people if person['Gender'] == 'Female']
    singles = [person for person in people if person['Marital_Status'] == 'Single']
    married = [person for person in people if person['Marital_Status'] != 'Single']
    
    attempts = 1000
    attempt_count = 0
    best_seating = [[] for _ in range(num_tables)]
    max_adjacent_singles = -1
    max_split_couples = -1
    best_alternating_seating_score = -1
    min_must_not_violations = float('inf')
    max_wants_score = -1

    print(f"Total males: {len(males)}")
    print(f"Total females: {len(females)}")
    print(f"Total singles: {len(singles)}")
    print(f"Total married: {len(married)}")

    while attempts > 0:
        print(f"Attempt {attempt_count + 1}: Shuffling and trying new arrangement.")
        
        random.shuffle(males)
        random.shuffle(females)
        
        seatings = [[] for _ in range(num_tables)]
        remaining_capacity = [table_capacity] * num_tables
        
        for i in range(num_tables):
            seatings[i] = alternate_gender_seating(males, females, table_capacity)
            remaining_capacity[i] -= len(seatings[i])
        
        all_seated = all(len(seating) == table_capacity for seating in seatings)
        if not all_seated:
            attempts -= 1
            attempt_count += 1
            print(f"Attempt {attempt_count + 1}: Incomplete seating, retrying...")
            continue
        
        adjusted_seatings = [ensure_no_adjacent_couples(seating) for seating in seatings]
        
        print(f"Attempt {attempt_count + 1}: Adjusted seatings:")
        for idx, seating in enumerate(adjusted_seatings):
            print(f"Table {idx + 1}: {[person['Name'] for person in seating]}")
        
        total_adjacent_singles = sum(count_adjacent_singles(seating) for seating in adjusted_seatings)
        split_couples = sum(count_split_couples(seating, other_seating) for i, seating in enumerate(adjusted_seatings) for other_seating in adjusted_seatings[i+1:])
        alternating_seating_score = sum(valid_alternating_seating(seating) for seating in adjusted_seatings)
        total_wants_score = sum(count_wants_score(seating) for seating in adjusted_seatings)
        total_must_not_violations = sum(count_must_not_violations(seating) for seating in adjusted_seatings)

        if (total_must_not_violations < min_must_not_violations or 
            (total_must_not_violations == min_must_not_violations and total_wants_score > max_wants_score) or
            (total_must_not_violations == min_must_not_violations and total_wants_score == max_wants_score and alternating_seating_score > best_alternating_seating_score) or 
            (total_must_not_violations == min_must_not_violations and total_wants_score == max_wants_score and alternating_seating_score == best_alternating_seating_score and split_couples > max_split_couples) or 
            (total_must_not_violations == min_must_not_violations and total_wants_score == max_wants_score and alternating_seating_score == best_alternating_seating_score and split_couples == max_split_couples and total_adjacent_singles > max_adjacent_singles)):
            
            min_must_not_violations = total_must_not_violations
            max_wants_score = total_wants_score
            best_alternating_seating_score = alternating_seating_score
            max_split_couples = split_couples
            max_adjacent_singles = total_adjacent_singles
            best_seating = adjusted_seatings
                
        attempts -= 1
        attempt_count += 1
        print(f"Attempt {attempt_count + 1}: Wants score: {total_wants_score}, Must not violations: {total_must_not_violations}\n")
    
    if any(best_seating):
        print(f"Best arrangement found with {max_split_couples} split couples, {max_adjacent_singles} adjacent singles, {max_wants_score} wants satisfied, {min_must_not_violations} must not violations, and alternating seating score of {best_alternating_seating_score}!")
    else:
        print("No valid arrangement found after 1000 attempts.")
    
    return best_seating

def plot_tables(tables, table_shape, table_capacity):
    num_tables = len(tables)
    fig, axes = plt.subplots(1, num_tables, figsize=(8 * num_tables, 8))
    if num_tables == 1:
        axes = [axes]

    def plot_table(ax, table, table_number):
        ax.set_aspect('equal')
    if table_shape == 'round':
        theta = np.linspace(0, 2*np.pi, table_capacity + 1)
        x = 1.75 * np.cos(theta)
        y = 1.75 * np.sin(theta)
        ax.set_xlim(-2, 2)
        ax.set_ylim(-2, 2)
    else:
        x = np.concatenate([np.linspace(-3, 3, table_capacity // 2), np.linspace(3, -3, table_capacity // 2)])
        y = np.array([1] * (table_capacity // 2) + [-1] * (table_capacity // 2))
        ax.set_xlim(-4, 4)
        ax.set_ylim(-4, 4)
    ax.axis('off')
    for i in range(len(table)):
        person = table[i]
        name_gender = f"{person['Name']}\n({person['Gender']})"
        marital_status = person['Marital_Status']
        if "Married" in marital_status:
            name_gender += f"\n{marital_status}"
        ax.text(x[i], y[i], name_gender, ha='center', va='center', bbox=dict(facecolor='white', alpha=0.5), fontsize=10)
    if table_shape == 'round':
        ax.add_patch(plt.Circle((0, 0), 1.75, color='lightblue', alpha=0.5))
    else:
        ax.add_patch(plt.Rectangle((-3.5, -1.5), 7, 3, color='lightblue', alpha=0.5))
    ax.text(0, 0, f'Table {table_number}', ha='center', va='center', fontsize=14, weight='bold')

for i, table in enumerate(tables):
    plot_table(axes[i], table, i + 1)

plt.suptitle('Seating Plan for Tables', fontsize=16)
plt.show()

def output_to_dataframe(tables):
    max_len = max(len(table) for table in tables)
    
    data = {}
    for i, table in enumerate(tables):
        data[f'Table {i + 1}'] = [f"{person['Name']} ({person['Gender']})" if person else '' for person in table]
        data[f'Marital Status {i + 1}'] = [person['Marital_Status'] if person else '' for person in table]

    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Seating arrangement for an event.')
    parser.add_argument('--filename', type=str, default='people.csv', help='CSV file with guest information')
    parser.add_argument('--table_shape', type=str, choices=['round', 'trestle'], default='round', help='Shape of the tables')
    parser.add_argument('--table_capacity', type=int, default=12, help='Number of people each table can seat')
    parser.add_argument('--num_tables', type=int, default=2, help='Number of tables available')
    
    args = parser.parse_args()
    
    people = read_csv(args.filename)

    if len(people) < 4:
        print("Not enough people in the CSV file. Please ensure there are at least 4 people.")
    else:
        tables = arrange_seating(people, args.table_capacity, args.num_tables)

        if any(tables):
            plot_tables(tables, args.table_shape, args.table_capacity)
            df = output_to_dataframe(tables)
            print(df)
        else:
            print("Could not find a valid seating arrangement that satisfies all conditions after 1000 attempts.")
