# Choose Your Own Adventure

Welcome to the **Choose Your Own Adventure** repository! This project template provides a ready-to-use structure for creating a multi-scene, text-based adventure with **4 separate scene files**, each split into **2 main sections** (or choice points). The primary goal is to help students learn both **Python basics** and **Git/GitHub collaboration** in a fun, creative context.

---

## Table of Contents
1. [Project Overview](#project-overview)  
2. [File Structure](#file-structure)  
3. [How to Get Started](#how-to-get-started)  
4. [Gameplay Flow](#gameplay-flow)  
5. [Editing Scenes](#editing-scenes)  
6. [Collaboration with Git & GitHub](#collaboration-with-git--github)  
7. [Running the Game](#running-the-game)  
8. [Next Steps & Ideas](#next-steps--ideas)  
9. [License](#license)

---

## Project Overview
- **Objective**: Build a **text-based adventure** using Python, where players navigate through four scenes, each containing two sections of story and choices.
- **Learning Goals**:
  - Practice Python fundamentals: variables, input/output, function structure.
  - Understand multi-file projects by dividing your game into separate Python scripts.
  - Learn collaborative coding using Git & GitHub workflows—branching, merging, and resolving conflicts.

---

## File Structure

```
Choose Your Own Adventure/
    ├── main.py
    ├── Scenes/
        ├── scene_1.py
        ├── scene_2.py
        ├── scene_3.py
        └── scene_4.py
```

1. **main.py**  
   - The entry point for the game. It imports and runs each scene’s `play_scene()` function in a loop.  
2. **scene_1.py** through **scene_4.py**  
   - Each file contains **two “sections”** where you can add story elements and choices.  
   - `play_scene()` returns the name of the next scene (or "quit" to end).

---

## How to Get Started

1. **Fork This Repository**  
   - On GitHub, click the **Fork** button to create your own copy under your GitHub account.  
   - This ensures each group can have its own version of the game.

2. **Clone Your Fork**  
   - Copy the repo's URL from github.
   - Clone the repo using VSCode.

3. **Plan Your Scenes**  
   - Decide the overall theme or setting (fantasy, sci-fi, mystery, etc.).  
   - Sketch out roughly what each scene will include, and how they link together.

---

## Gameplay Flow

- **Scene 1** (Two Sections)  
  - Introduces the setting.  
  - Player picks a path that eventually leads to Scene 2.
- **Scene 2** (Two Sections)  
  - Continues the story or introduces new challenges.  
  - Leads to Scene 3.
- **Scene 3** (Two Sections)  
  - Builds tension or complexity.  
  - Leads to Scene 4.
- **Scene 4** (Two Sections)  
  - Often a “climax” or “final” scene.  
  - After the second choice in Scene 4, the game ends (`return "quit"`).

---

## Editing Scenes

1. **Open the Scene File**  
   - For instance, if you are responsible for Scene 1, open `scene_1.py`.

2. **Fill in the Sections**  
   - Each scene template includes two printed sections and two user choices.  
   - Add descriptive text, puzzle elements, or small narrative twists.

3. **Return the Next Scene Name**  
   - At the end of each section, return a string like `"scene_2"`, `"scene_3"`, or `"scene_4"`.  
   - In Scene 4, you might return `"quit"` to conclude the game.

---

## Collaboration with Git & GitHub

1. **Create a Branch**  
   - Each member can create a feature branch for the scene they’re editing, for example:  
      -> feat/scene1-update

2. **Commit Frequently**  
   - Write clear commit messages, e.g., `Added intro text to scene 1`.

3. **Push & Open Pull Requests**  
   - Push your branch to GitHub:  
   - Open a Pull Request (PR) on GitHub to merge your changes into the main branch.

4. **Resolve Merge Conflicts**  
   - If two people edit the same file or line, Git will flag a conflict.  
   - Communicate with your team to decide how to combine code, then remove conflict markers and commit.

---

## Running the Game

1. **Install Python** (if not already)  
   - Ensure Python 3.x is installed on your machine.

2. **Navigate to the Project Folder**  
    - Open it in VSCode.
3. **Run the Game**  
    - Using VSCode.
4. **Follow Prompts**  
   - Type your choices as the story unfolds.

---

## Next Steps & Ideas

- **Additional Scenes**: Create more than four scenes if you want a longer adventure.  
- **Inventory System**: Keep track of items found; pass an `inventory` dict between scenes.  
- **Branching Paths**: Let different choices lead to different scenes, not just a linear flow.  
- **Sound or Visuals**: Print ASCII art or add background sounds for more immersion.

---

## License

- This project is provided as a **template** for educational purposes.  
- Feel free to modify, distribute, or extend it as needed.

---


## **Good luck, and enjoy crafting your unique adventure!**
