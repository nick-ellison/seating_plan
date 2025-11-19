import csv
import random
from faker import Faker

def generate_csv(filename):
    fake = Faker()
    num_people = random.randint(16, 24)
    names_genders = []
    
    male_prob = random.uniform(0.4, 0.6)
    
    while len(names_genders) < num_people:
        if random.random() < male_prob:
            name_gender = (fake.first_name_male(), 'Male')
        else:
            name_gender = (fake.first_name_female(), 'Female')
        
        if name_gender not in names_genders:
            names_genders.append(name_gender)
    
    # Assign marital status
    single_count = num_people // 3
    married_count = (num_people - single_count) // 2
    
    marital_status = ["Single"] * single_count + [""] * (num_people - single_count)
    married_pairs = []
    
    for i in range(married_count):
        idx1 = single_count + 2 * i
        idx2 = single_count + 2 * i + 1
        married_pairs.append((idx1, idx2))
    
    for idx1, idx2 in married_pairs:
        marital_status[idx1] = f"Married to {names_genders[idx2][0]}"
        marital_status[idx2] = f"Married to {names_genders[idx1][0]}"
    
    # Generate seating preferences
    wants_to_sit_next_to = [""] * num_people
    must_not_sit_next_to = [""] * num_people

    indices = list(range(num_people))
    random.shuffle(indices)
    preference_count = num_people // 5  # 20% of guests

    for i in indices[:preference_count]:
        potential_neighbours = [name for idx, (name, _) in enumerate(names_genders) if idx != i]
        if potential_neighbours:
            wants_to_sit_next_to[i] = random.choice(potential_neighbours)
            must_not_sit_next_to[i] = random.choice([name for name in potential_neighbours if name != wants_to_sit_next_to[i]])

    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["Name", "Gender", "Marital_Status", "Wants to sit next to", "Must not sit next to"])
        for i, ((name, gender), status) in enumerate(zip(names_genders, marital_status)):
            writer.writerow([name, gender, status, wants_to_sit_next_to[i], must_not_sit_next_to[i]])

generate_csv('people.csv')
