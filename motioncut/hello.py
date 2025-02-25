import random
import string
import sqlite3
import questionary

# Database setup
def setup_db():
    conn = sqlite3.connect("usernames.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            word TEXT NOT NULL
        )
    """)
    
    # Predefined adjectives and nouns
    adjectives = ["Cool", "Happy", "Crazy", "Wild", "Brave", "Fierce", "Loyal", "Gentle", "Smart", "Funny"]
    nouns = ["Tiger", "Dragon", "Eagle", "Knight", "Wizard", "Shadow", "Rider", "Hunter", "Warrior", "Phoenix"]
    
    # Insert words into database if not already present
    for adj in adjectives:
        cursor.execute("INSERT INTO words (type, word) VALUES (?, ?) ON CONFLICT DO NOTHING", ("adjective", adj))
    for noun in nouns:
        cursor.execute("INSERT INTO words (type, word) VALUES (?, ?) ON CONFLICT DO NOTHING", ("noun", noun))
    
    conn.commit()
    conn.close()

def get_words(word_type):
    conn = sqlite3.connect("usernames.db")
    cursor = conn.cursor()
    cursor.execute("SELECT word FROM words WHERE type = ?", (word_type,))
    words = [row[0] for row in cursor.fetchall()]
    conn.close()
    return words

def add_word(word_type):
    word = questionary.text(f"Enter a new {word_type}: ").ask()
    conn = sqlite3.connect("usernames.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO words (type, word) VALUES (?, ?) ON CONFLICT DO NOTHING", (word_type, word))
    conn.commit()
    conn.close()
    print(f"{word_type.capitalize()} '{word}' added successfully!")

def generate_username(num_adjectives=1, num_nouns=1, num_special_chars=1, include_numbers=True, length=8):
    """Generates a random username based on user preferences."""
    adjectives = get_words("adjective")
    nouns = get_words("noun")
    special_chars = "!@#$%^&*"
    
    adj_part = "".join(random.choices(adjectives, k=num_adjectives))
    noun_part = "".join(random.choices(nouns, k=num_nouns))
    special_part = "".join(random.choices(special_chars, k=num_special_chars)) if num_special_chars > 0 else ""
    
    username = adj_part + noun_part
    
    if include_numbers:
        username += str(random.randint(10, 99))
    
    username += special_part
    
    return username[:length]

def save_username(username, filename="usernames.txt"):
    """Saves generated username to a file."""
    with open(filename, "a") as file:
        file.write(username + "\n")
    print(f"Username '{username}' saved to {filename}.")

def main():
    """Main function to interact with the user."""
    setup_db()
    print("Welcome to the Random Username Generator!")
    
    while True:
        action = questionary.select(
            "What would you like to do?",
            choices=["Generate Username", "Add Adjective", "Add Noun", "Exit"]
        ).ask()
        
        if action == "Generate Username":
            num_adjectives = int(questionary.text("How many adjectives to include?").ask())
            num_nouns = int(questionary.text("How many nouns to include?").ask())
            num_special_chars = int(questionary.text("How many special characters to include?").ask())
            include_numbers = questionary.confirm("Include numbers?").ask()
            length = int(questionary.text("Enter desired username length (min 6, max 15):").ask())
            
            if length < 6 or length > 15:
                print("Invalid length! Using default length of 8.")
                length = 8
            
            username = generate_username(num_adjectives, num_nouns, num_special_chars, include_numbers, length)
            print(f"Generated Username: {username}")
            
            save_option = questionary.confirm("Do you want to save this username?").ask()
            if save_option:
                save_username(username)
        
        elif action == "Add Adjective":
            add_word("adjective")
        
        elif action == "Add Noun":
            add_word("noun")

        elif action == "Exit":
            print("Thank you for using the Random Username Generator!")


if __name__ == "__main__":
    main()
