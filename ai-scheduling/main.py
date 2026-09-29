
import json
from pathlib import Path
from datetime import datetime, timedelta, date

# Smart Study Planner
# Member 4 - AI Scheduling

folder = Path(__file__).parent
subject_file = folder / "subjects.json"
missed_file = folder / "missed_sessions.json"

# Default subjects
default_subjects = [
    {"name": "Python", "days_left": 3,
     "difficulty": 5, "completion": 40},
    {"name": "Java", "days_left": 7,
     "difficulty": 3, "completion": 70},
    {"name": "DBMS", "days_left": 2,
     "difficulty": 4, "completion": 30}
]

# Load saved subjects
if subject_file.exists():
    with open(subject_file, "r") as file:
        subjects = json.load(file)
else:
    subjects = default_subjects

# Load missed sessions
if missed_file.exists():
    with open(missed_file, "r") as file:
        missed_sessions = json.load(file)
else:
    missed_sessions = {}

# Convert old missed-session list to a dictionary
if isinstance(missed_sessions, list):
    missed_sessions = {
        name: 1.0 for name in missed_sessions
    }
    print("Old missed sessions converted to 1 hour each.")

# Add a new subject
add_new = input(
    "Would you like to add a new subject? (yes/no): "
).strip().lower()

if add_new == "yes":
    name = input("Enter subject name: ").strip()

    if not name:
        print("Subject name cannot be empty.")
    elif any(s["name"].lower() == name.lower()
             for s in subjects):
        print("This subject already exists.")
    else:
        try:
            exam_date = input(
                "Enter exam date (YYYY-MM-DD): "
            ).strip()

            exam_day = datetime.strptime(
                exam_date, "%Y-%m-%d"
            ).date()

            if exam_day < date.today():
                print("Exam date cannot be in the past.")
            else:
                difficulty = int(
                    input("Enter difficulty (1-5): ")
                )
                completion = int(
                    input("Enter completion (0-100): ")
                )

                if not 1 <= difficulty <= 5:
                    print("Difficulty must be from 1 to 5.")
                elif not 0 <= completion <= 100:
                    print("Completion must be from 0 to 100.")
                else:
                    days_left = (exam_day - date.today()).days

                    new_subject = {
                        "name": name,
                        "days_left": days_left,
                        "difficulty": difficulty,
                        "completion": completion
                    }

                    subjects.append(new_subject)

                    with open(subject_file, "w") as file:
                        json.dump(subjects, file, indent=4)

                    print("New subject added successfully!")

        except ValueError:
            print("Enter a valid date, difficulty and completion.")

# Update subject completion
print("\nSUBJECTS:", ", ".join(s["name"] for s in subjects))
name = input("Enter subject to update (or none): ").strip()

if name.lower() != "none":
    found = False

    for subject in subjects:
        if subject["name"].lower() == name.lower():
            found = True

            try:
                completion = int(
                    input("Enter completion percentage: ")
                )

                if 0 <= completion <= 100:
                    subject["completion"] = completion
                    print("Completion saved successfully.")
                else:
                    print("Enter a percentage from 0 to 100.")

            except ValueError:
                print("Please enter a valid number.")

            break

    if not found:
        print("Subject not found.")

# Mark missed work as completed
if missed_sessions:
    print("\nPENDING MISSED SESSIONS")
    print("-----------------------")

    for name, hours in missed_sessions.items():
        print(f"{name}: {hours:.2f} hours")

    completed = input(
        "\nEnter completed missed subject (or none): "
    ).strip()

    if completed.lower() != "none":
        matching = next(
            (name for name in missed_sessions
             if name.lower() == completed.lower()),
            None
        )

        if matching:
            del missed_sessions[matching]
            print("Missed work marked as completed.")
        else:
            print("Subject not found in missed sessions.")
else:
    print("\nNo missed sessions to complete.")

# Record a newly missed session
missed = input(
    "\nEnter newly missed subject (or none): "
).strip()

if missed.lower() != "none":
    matching = next(
        (s for s in subjects
         if s["name"].lower() == missed.lower()),
        None
    )

    if matching:
        try:
            missed_hours = float(
                input("Enter missed study hours: ")
            )

            if not 0 < missed_hours <= 24:
                print("Enter hours greater than 0 and at most 24.")
            else:
                subject_name = matching["name"]
                missed_sessions[subject_name] = (
                    missed_sessions.get(subject_name, 0)
                    + missed_hours
                )
                print("Missed hours saved successfully.")

        except ValueError:
            print("Enter a valid number of hours.")
    else:
        print("Subject not found.")

# Choose missed hours to reschedule
reschedule = {}

if missed_sessions:
    print("\nRESCHEDULE MISSED HOURS")
    print("-----------------------")

    for name, pending_hours in missed_sessions.items():
        print(f"\n{name}: {pending_hours:.2f} pending hours")

        while True:
            try:
                hours = float(input(
                    f"How many hours to reschedule for {name}? "
                    f"(0 to {pending_hours:.2f}): "
                ))

                if 0 <= hours <= pending_hours:
                    reschedule[name] = hours
                    break

                print("Enter hours within the pending amount.")

            except ValueError:
                print("Enter a valid number.")

# Calculate priority
for subject in subjects:
    urgency = 10 / max(subject["days_left"], 1)
    difficulty = subject["difficulty"] / 5
    incomplete = (100 - subject["completion"]) / 100

    priority = (
        urgency * 5
        + difficulty * 3
        + incomplete * 2
    )

    if subject["name"] in missed_sessions:
        priority += 5

    subject["priority"] = priority

# Sort subjects by priority
subjects.sort(
    key=lambda x: x["priority"],
    reverse=True
)

# Display priorities
print("\nUPDATED SUBJECT PRIORITIES")
print("---------------------------")

for i, subject in enumerate(subjects, start=1):
    print(f"\nPriority {i}: {subject['name']}")
    print(f"Completion: {subject['completion']}%")
    print(f"Priority score: {subject['priority']:.2f}")

# Get available study hours
try:
    available_hours = float(
        input("\nAvailable study hours: ")
    )

    if not 0 < available_hours <= 24:
        raise ValueError

except ValueError:
    print("Enter study hours greater than 0 and at most 24.")
    raise SystemExit

# Calculate total hours
recovery_hours = sum(reschedule.values())
total_hours = available_hours + recovery_hours

if total_hours > 24:
    print("\nTotal study hours exceed 24.")
    print("Reduce available or rescheduled hours.")
    raise SystemExit

# Get starting time
try:
    start_time = input("Enter start time (HH:MM): ")
    current_time = datetime.strptime(start_time, "%H:%M")

except ValueError:
    print("Enter a valid time in HH:MM format, e.g. 09:00.")
    raise SystemExit

# Deduct rescheduled hours from pending hours
for name, hours in reschedule.items():
    remaining = missed_sessions[name] - hours

    if remaining <= 0.000001:
        del missed_sessions[name]
    else:
        missed_sessions[name] = round(remaining, 6)

# Save the remaining missed hours
with open(missed_file, "w") as file:
    json.dump(missed_sessions, file, indent=4)

# Generate daily timetable
total_priority = sum(s["priority"] for s in subjects)

print("\nDAILY STUDY TIMETABLE")
print("---------------------")
print(f"Regular study hours: {available_hours:.2f}")
print(f"Rescheduled hours: {recovery_hours:.2f}")
print(f"Total study hours: {total_hours:.2f}")

for i, subject in enumerate(subjects, start=1):
    regular_hours = (
        available_hours
        * subject["priority"]
        / total_priority
    )

    extra_hours = reschedule.get(subject["name"], 0)
    hours = regular_hours + extra_hours

    end_time = current_time + timedelta(hours=hours)

    print(f"\nPriority {i}: {subject['name']}")
    print("Start:", current_time.strftime("%H:%M"))
    print("End:", end_time.strftime("%H:%M"))
    print(f"Regular duration: {regular_hours:.2f} hours")

    if extra_hours > 0:
        print(f"Rescheduled duration: {extra_hours:.2f} hours")

    if subject["name"] in missed_sessions:
        print("Status: Has pending missed work")

    current_time = end_time

# Display remaining missed sessions
print("\nPENDING MISSED SESSIONS")
print("-----------------------")

if missed_sessions:
    for name, hours in missed_sessions.items():
        print(f"{name}: {hours:.2f} hours remaining")
else:
    print("No missed sessions.")

# Save updated subjects
with open(subject_file, "w") as file:
    json.dump(subjects, file, indent=4)

print("\nStudy timetable generated successfully!")