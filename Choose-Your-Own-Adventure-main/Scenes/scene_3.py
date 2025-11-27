# scene_3.py

def play_scene():
    """
    Scene 3 Template:
    - Section A (Choice 1)
    - Section B (Choice 2)
    - Returns "scene_4", "quit", or another scene name.
    """

    print("\n=== SCENE 3 ===")
    print("Section A: [Describe the environment or situation for scene 3]")
    
    choice_a = input("You can 'look around' or 'call out': ").lower().strip()

    if choice_a == "look around":
        print("You carefully examine your surroundings...")
        # Placeholder logic
    elif choice_a == "call out":
        print("You shout to see if anyone—or anything—responds...")
        # Placeholder logic
    else:
        print("You stand still, unsure of what to do.")
    
    print("\n--- Moving to Section B of Scene 3 ---")
    print("Section B: [Provide a second scenario or decision in scene 3]")
    
    choice_b = input("Do you 'hide' or 'push forward'? ").lower().strip()

    if choice_b == "hide":
        print("You find a small nook and hide yourself...")
        return "scene_4"
    elif choice_b == "push forward":
        print("You choose to push forward, determined to find answers...")
        return "scene_4"
    else:
        print("Uncertain action. Eventually, you decide to keep going.")
        return "scene_4"

