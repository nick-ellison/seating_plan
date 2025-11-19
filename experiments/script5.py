import csv
import random
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

def read_csv(filename):
    people = []
    with open(filename, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            people.append(row)
    return people

def is_married_to(person1, person2):
    return (f"Married to {person2['Name']}" in person1['Marital_Status']) or (f"Married to {person1['Name']}" in person2['Marital_Status'])

def alternate_gender_seating(males, females, count=12):
    seating = []
    male_turn = True if len(males) >= len(females) else False
    while len(seating) < count and (males or females):
        if male_turn and males:
            seating.append(males.pop())
        elif females:
            seating.append(females.pop())
        male_turn = not male_turn
    while len(seating) < count and males:
        seating.append(males.pop())
    while len(seating) < count and females:
        seating.append(females.pop())
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

def arrange_seating(people):
    males = [person for person in people if person['Gender'] == 'Male']
    females = [person for person in people if person['Gender'] == 'Female']
    singles = [person for person in people if person['Marital_Status'] == 'Single']
    married = [person for person in people if person['Marital_Status'] != 'Single']
    
    attempts = 1000
    attempt_count = 0
    best_seating1, best_seating2 = None, None
    max_adjacent_singles = -1
    max_split_couples = -1
    best_alternating_seating_score = -1
    
    while attempts > 0:
        random.shuffle(males)
        random.shuffle(females)
        random.shuffle(singles)
        random.shuffle(married)
        
        print(f"Attempt {attempt_count + 1}: Shuffling and trying new arrangement.")
        print(f"Males: {[person['Name'] for person in males]}")
        print(f"Females: {[person['Name'] for person in females]}")
        
        # Ensure roughly even distribution of singles
        singles_males = [person for person in singles if person['Gender'] == 'Male']
        singles_females = [person for person in singles if person['Gender'] == 'Female']
        married_males = [person for person in married if person['Gender'] == 'Male']
        married_females = [person for person in married if person['Gender'] == 'Female']
        
        seating1_singles_males = singles_males[:len(singles_males)//2]
        seating2_singles_males = singles_males[len(singles_males)//2:]
        seating1_singles_females = singles_females[:len(singles_females)//2]
        seating2_singles_females = singles_females[len(singles_females)//2:]
        
        seating1_married_males = married_males[:len(married_males)//2]
        seating2_married_males = married_males[len(married_males)//2:]
        seating1_married_females = married_females[:len(married_females)//2]
        seating2_married_females = married_females[len(married_females)//2:]
        
        seating1_males = seating1_singles_males + seating1_married_males
        seating2_males = seating2_singles_males + seating2_married_males
        seating1_females = seating1_singles_females + seating1_married_females
        seating2_females = seating2_singles_females + seating2_married_females
        
        seating1 = alternate_gender_seating(seating1_males, seating1_females)
        seating2 = alternate_gender_seating(seating2_males, seating2_females)
        
        print(f"Attempt {attempt_count + 1}: Initial seating for Table 1: {[person['Name'] for person in seating1]}")
        print(f"Attempt {attempt_count + 1}: Initial seating for Table 2: {[person['Name'] for person in seating2]}")
        
        seating1 = ensure_no_adjacent_couples(seating1)
        seating2 = ensure_no_adjacent_couples(seating2)
        
        print(f"Attempt {attempt_count + 1}: Adjusted seating for Table 1: {[person['Name'] for person in seating1]}")
        print(f"Attempt {attempt_count + 1}: Adjusted seating for Table 2: {[person['Name'] for person in seating2]}")
        
        adjacent_singles1 = count_adjacent_singles(seating1)
        adjacent_singles2 = count_adjacent_singles(seating2)
        total_adjacent_singles = adjacent_singles1 + adjacent_singles2
        
        split_couples = count_split_couples(seating1, seating2)
        
        alternating_seating_score = valid_alternating_seating(seating1) + valid_alternating_seating(seating2)
        
        if (alternating_seating_score > best_alternating_seating_score or 
            (alternating_seating_score == best_alternating_seating_score and split_couples > max_split_couples) or 
            (alternating_seating_score == best_alternating_seating_score and split_couples == max_split_couples and total_adjacent_singles > max_adjacent_singles)):
            best_alternating_seating_score = alternating_seating_score
            max_split_couples = split_couples
            max_adjacent_singles = total_adjacent_singles
            best_seating1, best_seating2 = seating1, seating2
                
        attempts -= 1
        attempt_count += 1
        print(f"Attempt {attempt_count + 1}: No valid arrangement found")
    
    if best_seating1 and best_seating2:
        print(f"Best arrangement found with {max_split_couples} split couples, {max_adjacent_singles} adjacent singles, and alternating seating score of {best_alternating_seating_score}!")
    else:
        print("No valid arrangement found after 1000 attempts.")
    
    return best_seating1, best_seating2

def plot_tables(table1, table2):
    fig, ax = plt.subplots(1, 2, figsize=(16, 8))
    
    theta = np.linspace(0, 2*np.pi, 13)
    x = 1.75 * np.cos(theta)
    y = 1.75 * np.sin(theta)
    
    def plot_table(ax, table, table_number):
        ax.set_aspect('equal')
        ax.set_xlim(-2.5, 2.5)
        ax.set_ylim(-2.5, 2.5)
        ax.axis('off')
        for i in range(len(table)):
            person = table[i]
            name_gender = f"{person['Name']}\n({person['Gender']})"
            marital_status = person['Marital_Status']
            if "Married" in marital_status:
                name_gender += f"\n{marital_status}"
            ax.text(x[i], y[i], name_gender, ha='center', va='center', bbox=dict(facecolor='white', alpha=0.5), fontsize=10)
        ax.add_patch(plt.Circle((0, 0), 1, color='lightblue', alpha=0.5))
        ax.text(0, 0, f'Table {table_number}', ha='center', va='center', fontsize=14, weight='bold')
    
    plot_table(ax[0], table1, 1)
    plot_table(ax[1], table2, 2)
    
    plt.suptitle('Seating Plan for Two Tables', fontsize=16)
    plt.show()

def output_to_dataframe(table1, table2):
    data = {
        'Table 1': [f"{person['Name']} ({person['Gender']})" for person in table1],
        'Marital Status 1': [person['Marital_Status'] for person in table1],
        'Table 2': [f"{person['Name']} ({person['Gender']})" for person in table2],
        'Marital Status 2': [person['Marital_Status'] for person in table2],
    }
    df = pd.DataFrame(data)
    return df

# Read the CSV and arrange seating
people = read_csv('people.csv')

# Ensure there are at least 24 people
if len(people) < 24:
    print("Not enough people in the CSV file. Please ensure there are at least 24 people.")
else:
    table1, table2 = arrange_seating(people)

    if table1 is not None and table2 is not None:
        # Visualize the seating plan
        plot_tables(table1, table2)

        # Output results to a dataframe
        df = output_to_dataframe(table1, table2)
        print(df)
    else:
        print("Could not find a valid seating arrangement that satisfies all conditions after 1000 attempts.")
