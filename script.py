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
    while len(seating) < count and males and females:
        if len(seating) % 2 == 0:
            seating.append(males.pop())
        else:
            seating.append(females.pop())
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

def arrange_seating(people):
    males = [person for person in people if person['Gender'] == 'Male']
    females = [person for person in people if person['Gender'] == 'Female']
    
    attempts = 1000
    attempt_count = 0
    
    while attempts > 0:
        random.shuffle(males)
        random.shuffle(females)
        
        print(f"Attempt {attempt_count + 1}: Shuffling and trying new arrangement.")
        print(f"Males: {[person['Name'] for person in males]}")
        print(f"Females: {[person['Name'] for person in females]}")
        
        # Correctly split the males and females into two groups for two tables
        seating1_males, seating2_males = males[:6], males[6:12]
        seating1_females, seating2_females = females[:6], females[6:12]
        
        seating1 = alternate_gender_seating(seating1_males, seating1_females)
        seating2 = alternate_gender_seating(seating2_males, seating2_females)
        
        print(f"Attempt {attempt_count + 1}: Initial seating for Table 1: {[person['Name'] for person in seating1]}")
        print(f"Attempt {attempt_count + 1}: Initial seating for Table 2: {[person['Name'] for person in seating2]}")
        
        seating1 = ensure_no_adjacent_couples(seating1)
        seating2 = ensure_no_adjacent_couples(seating2)
        
        print(f"Attempt {attempt_count + 1}: Adjusted seating for Table 1: {[person['Name'] for person in seating1]}")
        print(f"Attempt {attempt_count + 1}: Adjusted seating for Table 2: {[person['Name'] for person in seating2]}")
        
        if valid_alternating_seating(seating1) and valid_alternating_seating(seating2) and len(seating1) == 12 and len(seating2) == 12:
            print(f"Valid arrangement found on attempt {attempt_count + 1}!")
            return seating1, seating2
        
        attempts -= 1
        attempt_count += 1
        print(f"Attempt {attempt_count + 1}: No valid arrangement found")
    
    print("No valid arrangement found after 1000 attempts.")
    return None, None

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
