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
    {"name": "Python", "days_left": 3, "difficulty": 5, "completion": 40},
    {"name": "Java", "days_left": 7, "difficulty": 3, "completion": 70},
    {"name": "DBMS", "days_left": 2, "difficulty": 4, "completion": 30}
]


def load_json(file_path, default):
    if not file_path.exists():
        return default

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        print(f"Could not read {file_path.name}. Using default data.")
        return default


def save_json(file_path, data):
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)


def ask_yes_no(prompt):
    while True:
        answer = input(prompt).strip().lower()

        if answer in ("yes", "no"):
            return answer

        print("Please enter yes or no.")


def ask_int(prompt, minimum, maximum):
    while True:
        try:
            value = int(input(prompt).strip())

            if minimum <= value <= maximum:
                return value

            print(f"Enter a number from {minimum} to {maximum}.")

        except ValueError:
            print("Please enter a whole number.")


def ask_float(prompt, minimum, maximum):
    while True:
        try:
            value = float(input(prompt).strip())

            if minimum <= value <= maximum:
                return value

            print(f"Enter a number from {minimum} to {maximum}.")

        except ValueError:
            print("Please enter a valid number.")


def ask_time(prompt):
    while True:
        value = input(prompt).strip()

        try:
            return datetime.strptime(value, "%H:%M")

        except ValueError:
            print("Enter a valid time in HH:MM format, e.g. 09:00.")


# Load saved subjects and missed sessions
subjects = load_json(subject_file, default_subjects)
missed_sessions = load_json(missed_file, {})

if not isinstance(subjects, list):
    print("Invalid subjects.json format. Using default subjects.")
    subjects = default_subjects

if not isinstance(missed_sessions, (dict, list)):
    print("Invalid missed_sessions.json format. Starting with no missed hours.")
    missed_sessions = {}

# Convert old missed-session list to a dictionary
if isinstance(missed_sessions, list):
    missed_sessions = {name: 1.0 for name in missed_sessions}
    print("Old missed sessions converted to 1 hour each.")

# Validate loaded subject data
subjects = [
    s for s in subjects
    if isinstance(s, dict)
    and isinstance(s.get("name"), str)
    and s["name"].strip()
    and isinstance(s.get("days_left"), (int, float))
    and not isinstance(s.get("days_left"), bool)
    and s["days_left"] >= 0
    and isinstance(s.get("difficulty"), int)
    and not isinstance(s.get("difficulty"), bool)
    and 1 <= s["difficulty"] <= 5
    and isinstance(s.get("completion"), int)
    and not isinstance(s.get("completion"), bool)
    and 0 <= s["completion"] <= 100
]

# Validate loaded missed-session data
clean_missed = {}

for name, hours in missed_sessions.items():
    if (
        isinstance(name, str)
        and name.strip()
        and isinstance(hours, (int, float))
        and not isinstance(hours, bool)
        and 0 <= hours <= 24
    ):
        if hours > 0:
            clean_missed[name] = float(hours)

missed_sessions = clean_missed

if not subjects:
    print("No valid subjects found. Add a subject before making a timetable.")
    raise SystemExit


# Add a new subject
add_new = ask_yes_no("Would you like to add a new subject? (yes/no): ")

if add_new == "yes":
    name = input("Enter subject name: ").strip()

    if not name:
        print("Subject name cannot be empty.")

    elif any(s["name"].lower() == name.lower() for s in subjects):
        print("This subject already exists.")

    else:
        while True:
            exam_date = input("Enter exam date (YYYY-MM-DD): ").strip()

            try:
                exam_day = datetime.strptime(
                    exam_date, "%Y-%m-%d"
                ).date()

                if exam_day < date.today():
                    print("Exam date cannot be in the past.")
                    continue

                break

            except ValueError:
                print("Enter a valid date in YYYY-MM-DD format.")

        difficulty = ask_int("Enter difficulty (1-5): ", 1, 5)
        completion = ask_int("Enter completion (0-100): ", 0, 100)
        days_left = (exam_day - date.today()).days

        subjects.append({
            "name": name,
            "days_left": days_left,
            "difficulty": difficulty,
            "completion": completion
        })

        save_json(subject_file, subjects)
        print("New subject added successfully!")


# Update subject completion
print("\nSUBJECTS:", ", ".join(s["name"] for s in subjects))

name = input("Enter subject to update (or none): ").strip()

if name.lower() != "none":
    matching = next(
        (s for s in subjects if s["name"].lower() == name.lower()),
        None
    )

    if matching:
        completion = ask_int(
            "Enter completion percentage (0-100): ", 0, 100
        )
        matching["completion"] = completion
        print("Completion saved successfully.")

    else:
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
            (
                name for name in missed_sessions
                if name.lower() == completed.lower()
            ),
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
missed = input("\nEnter newly missed subject (or none): ").strip()

if missed.lower() != "none":
    matching = next(
        (s for s in subjects if s["name"].lower() == missed.lower()),
        None
    )

    if matching:
        missed_hours = ask_float(
            "Enter missed study hours (0.01-24): ", 0.01, 24
        )

        subject_name = matching["name"]

        missed_sessions[subject_name] = (
            missed_sessions.get(subject_name, 0) + missed_hours
        )

        print("Missed hours saved successfully.")

    else:
        print("Subject not found.")


# Choose missed hours to reschedule
reschedule = {}

if missed_sessions:
    print("\nRESCHEDULE MISSED HOURS")
    print("-----------------------")

    for name, pending_hours in missed_sessions.items():
        print(f"\n{name}: {pending_hours:.2f} pending hours")

        hours = ask_float(
            f"How many hours to reschedule for {name} "
            f"(0 to {pending_hours:.2f}): ",
            0,
            pending_hours
        )

        reschedule[name] = hours


# Calculate priority
for subject in subjects:
    urgency = 10 / max(subject["days_left"], 1)
    difficulty = subject["difficulty"] / 5
    incomplete = (100 - subject["completion"]) / 100

    priority = urgency * 5 + difficulty * 3 + incomplete * 2

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
available_hours = ask_float(
    "\nAvailable study hours (0.01-24): ", 0.01, 24
)


# Calculate total hours
recovery_hours = sum(reschedule.values())
total_hours = available_hours + recovery_hours

if total_hours > 24:
    print("\nTotal study hours exceed 24.")
    print("Reduce available or rescheduled hours.")
    raise SystemExit


# Get starting time and ensure timetable fits within the day
while True:
    start_time = ask_time("Enter start time (HH:MM): ")

    end_minutes = (
        start_time.hour * 60
        + start_time.minute
        + total_hours * 60
    )

    if end_minutes <= 24 * 60:
        break

    print(
        "The timetable would go past midnight. "
        "Enter an earlier start time or fewer hours."
    )


# Deduct rescheduled hours from pending hours
for name, hours in reschedule.items():
    remaining = missed_sessions[name] - hours

    if remaining <= 0.000001:
        del missed_sessions[name]
    else:
        missed_sessions[name] = round(remaining, 6)

save_json(missed_file, missed_sessions)


# Generate daily timetable
total_priority = sum(s["priority"] for s in subjects)

print("\nDAILY STUDY TIMETABLE")
print("---------------------")
print(f"Regular study hours: {available_hours:.2f}")
print(f"Rescheduled hours: {recovery_hours:.2f}")
print(f"Total study hours: {total_hours:.2f}")

current_time = start_time

for i, subject in enumerate(subjects, start=1):
    regular_hours = (
        available_hours * subject["priority"] / total_priority
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
save_json(subject_file, subjects)

print("\nStudy timetable generated successfully!")