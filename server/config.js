'use strict';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STARTING_LLAMAS = [
  { id: 1, name: 'Adam', gender: 'm', age: 36, bio: 'A reliable presence in the commune; steady and self-driven; is friendly, but rarely joins in; also labels shelves and actually uses the labels.', stats: { sharingTolerance: 4, cookingSkill: 9, tidiness: 16, handiness: 11, consideration: 12, sociability: 6, partyStamina: 10, workEthic: 17 } },
  { id: 2, name: 'Adrian', gender: 'm', age: 29, bio: 'A bit of an acquired taste, but useful; happy to share gear and leftovers; taps out early, reliably.', stats: { sharingTolerance: 16, cookingSkill: 11, tidiness: 13, handiness: 12, consideration: 11, sociability: 11, partyStamina: 6, workEthic: 10 } },
  { id: 3, name: 'Alex', gender: 'm', age: 32, bio: 'Brings a distinct energy to the house; notices moods and checks in early; needs quiet to reset; also fixes what breaks before anyone notices; but needs a lot of solo recharge time.', stats: { sharingTolerance: 10, cookingSkill: 12, tidiness: 12, handiness: 16, consideration: 16, sociability: 6, partyStamina: 7, workEthic: 11 } },
  { id: 4, name: 'Amy', gender: 'f', age: 37, bio: 'Brings a distinct energy to the house; keeps the group chat alive; is weirdly energised by noise and lights; also works in bursts, not routines; but leaves a trail of mugs and laundry.', stats: { sharingTolerance: 9, cookingSkill: 12, tidiness: 7, handiness: 9, consideration: 11, sociability: 16, partyStamina: 16, workEthic: 7 } },
  { id: 5, name: 'Anand', gender: 'm', age: 31, bio: 'Brings a distinct energy to the house; makes decisions with the group in mind; taps out early, reliably; also does small clean-ups before they become problems; but is allergic to all-nighters.', stats: { sharingTolerance: 9, cookingSkill: 11, tidiness: 16, handiness: 11, consideration: 17, sociability: 5, partyStamina: 4, workEthic: 9 } },
  { id: 6, name: 'Andrew', gender: 'm', age: 45, bio: 'Easy to live with on a good day; turns plans into checklists and outcomes; can be blunt without noticing; also can turn pantry scraps into a meal.', stats: { sharingTolerance: 7, cookingSkill: 16, tidiness: 9, handiness: 10, consideration: 5, sociability: 12, partyStamina: 10, workEthic: 16 } },
  { id: 7, name: 'Andy', gender: 'm', age: 31, bio: "A bit of an acquired taste, but useful; shares without keeping score; struggles with follow-through; also can't see mess until it's catastrophic.", stats: { sharingTolerance: 16, cookingSkill: 9, tidiness: 6, handiness: 10, consideration: 9, sociability: 9, partyStamina: 11, workEthic: 6 } },
  { id: 8, name: 'Anna', gender: 'f', age: 35, bio: 'Brings a distinct energy to the house; fixes what breaks before anyone notices; cannot do loud nights twice in a row; also keeps chats short and sweet.', stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 12, handiness: 16, consideration: 13, sociability: 6, partyStamina: 5, workEthic: 12 } },
  { id: 9, name: 'Ashley', gender: 'm', age: 40, bio: "Brings a distinct energy to the house; finishes what they start; doesn't read the room very well; also cannot relax in a messy kitchen.", stats: { sharingTolerance: 7, cookingSkill: 10, tidiness: 13, handiness: 9, consideration: 3, sociability: 10, partyStamina: 10, workEthic: 17 } },
  { id: 10, name: 'Brenton', gender: 'm', age: 27, bio: 'Low drama by default; always knows what everyone is up to; treats weeknights like weekends; also works in bursts, not routines; but leaves a trail of mugs and laundry.', stats: { sharingTolerance: 12, cookingSkill: 12, tidiness: 5, handiness: 13, consideration: 9, sociability: 16, partyStamina: 16, workEthic: 7 } },
  { id: 11, name: 'Cass', gender: 'f', age: 38, bio: 'Brings a distinct energy to the house; builds shelves for fun; is allergic to all-nighters; also keeps chats short and sweet.', stats: { sharingTolerance: 13, cookingSkill: 11, tidiness: 12, handiness: 18, consideration: 11, sociability: 6, partyStamina: 4, workEthic: 12 } },
  { id: 12, name: 'Celine', gender: 'f', age: 29, bio: 'A bit of an acquired taste, but useful; happy to share gear and leftovers; needs quiet to reset; also cannot relax in a messy kitchen.', stats: { sharingTolerance: 16, cookingSkill: 13, tidiness: 13, handiness: 10, consideration: 12, sociability: 13, partyStamina: 4, workEthic: 10 } },
  { id: 13, name: 'Chloe', gender: 'f', age: 29, bio: 'Mostly chill, until something crosses a line; can turn pantry scraps into a meal; starts clean-ups, rarely finishes them; also shares without keeping score.', stats: { sharingTolerance: 16, cookingSkill: 17, tidiness: 6, handiness: 12, consideration: 11, sociability: 11, partyStamina: 9, workEthic: 6 } },
  { id: 14, name: 'Cli', gender: 'f', age: 33, bio: 'Tends to keep their head down; does small clean-ups before they become problems; needs quiet to reset; also shows up consistently, even for boring jobs.', stats: { sharingTolerance: 13, cookingSkill: 11, tidiness: 16, handiness: 10, consideration: 12, sociability: 9, partyStamina: 6, workEthic: 16 } },
  { id: 15, name: 'Dan', gender: 'm', age: 33, bio: 'Mostly chill, until something crosses a line; fixes what breaks before anyone notices; avoids group debates; also notices moods and checks in early.', stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 12, handiness: 16, consideration: 16, sociability: 6, partyStamina: 10, workEthic: 11 } },
  { id: 16, name: 'Debbie', gender: 'f', age: 28, bio: 'Low drama by default; makes decisions with the group in mind; is allergic to all-nighters; also owns no tools and wants it that way.', stats: { sharingTolerance: 10, cookingSkill: 10, tidiness: 11, handiness: 4, consideration: 17, sociability: 10, partyStamina: 6, workEthic: 12 } },
  { id: 17, name: 'Emily', gender: 'f', age: 37, bio: 'Easy to live with on a good day; makes proper communal dinners; gets stressed when stuff is borrowed; also finishes what they start.', stats: { sharingTolerance: 4, cookingSkill: 18, tidiness: 11, handiness: 12, consideration: 10, sociability: 12, partyStamina: 11, workEthic: 16 } },
  { id: 18, name: 'Fabien', gender: 'm', age: 27, bio: 'Low drama by default; shows up consistently, even for boring jobs; taps out early, reliably; also calls someone else when things break.', stats: { sharingTolerance: 11, cookingSkill: 9, tidiness: 10, handiness: 6, consideration: 12, sociability: 11, partyStamina: 4, workEthic: 17 } },
  { id: 19, name: 'Florence', gender: 'f', age: 31, bio: "Friendly in their own way; remembers everyone's preferences; cannot do loud nights twice in a row; also fixes what breaks before anyone notices; but starts clean-ups, rarely finishes them.", stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 6, handiness: 16, consideration: 16, sociability: 9, partyStamina: 5, workEthic: 9 } },
  { id: 20, name: 'Florian', gender: 'm', age: 33, bio: 'Mostly chill, until something crosses a line; fixes what breaks before anyone notices; labels their food and means it; also struggles with follow-through.', stats: { sharingTolerance: 4, cookingSkill: 12, tidiness: 11, handiness: 16, consideration: 10, sociability: 12, partyStamina: 11, workEthic: 6 } },
  { id: 21, name: 'George', gender: 'm', age: 31, bio: 'A reliable presence in the commune; does small clean-ups before they become problems; cannot do loud nights twice in a row; also works in bursts, not routines; but orders in before considering the fridge.', stats: { sharingTolerance: 11, cookingSkill: 4, tidiness: 16, handiness: 12, consideration: 12, sociability: 9, partyStamina: 5, workEthic: 7 } },
  { id: 22, name: 'Georgia', gender: 'f', age: 37, bio: "Brings a distinct energy to the house; keeps the group chat alive; has a second wind at midnight; also procrastinates until it's urgent; but leaves a trail of mugs and laundry.", stats: { sharingTolerance: 10, cookingSkill: 10, tidiness: 6, handiness: 11, consideration: 11, sociability: 16, partyStamina: 17, workEthic: 7 } },
  { id: 23, name: 'Hailey', gender: 'f', age: 37, bio: "Easy to live with on a good day; always knows what everyone is up to; treats weeknights like weekends; also procrastinates until it's urgent; but can't see mess until it's catastrophic.", stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 6, handiness: 10, consideration: 12, sociability: 17, partyStamina: 16, workEthic: 7 } },
  { id: 24, name: 'Harri', gender: 'm', age: 31, bio: 'A bit of an acquired taste, but useful; fixes what breaks before anyone notices; needs clear boundaries around sharing; also cannot do loud nights twice in a row.', stats: { sharingTolerance: 4, cookingSkill: 11, tidiness: 12, handiness: 16, consideration: 12, sociability: 11, partyStamina: 6, workEthic: 12 } },
  { id: 25, name: 'Henry', gender: 'm', age: 33, bio: 'Low drama by default; keeps surfaces clear and systems tidy; orders in before considering the fridge; also finishes what they start.', stats: { sharingTolerance: 12, cookingSkill: 6, tidiness: 17, handiness: 11, consideration: 10, sociability: 9, partyStamina: 12, workEthic: 16 } },
  { id: 26, name: 'Holly', gender: 'f', age: 28, bio: 'Friendly in their own way; shares without keeping score; is allergic to all-nighters; also does small clean-ups before they become problems.', stats: { sharingTolerance: 17, cookingSkill: 11, tidiness: 16, handiness: 11, consideration: 10, sociability: 10, partyStamina: 4, workEthic: 12 } },
  { id: 27, name: 'Irene', gender: 'f', age: 27, bio: "A reliable presence in the commune; remembers everyone's preferences; is allergic to all-nighters; also turns broken things into weekend projects.", stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 10, handiness: 16, consideration: 16, sociability: 10, partyStamina: 6, workEthic: 12 } },
  { id: 28, name: 'Izzy', gender: 'f', age: 29, bio: 'Brings a distinct energy to the house; keeps the group chat alive; has a second wind at midnight; also labels their food and means it.', stats: { sharingTolerance: 4, cookingSkill: 10, tidiness: 11, handiness: 12, consideration: 12, sociability: 17, partyStamina: 16, workEthic: 12 } },
  { id: 29, name: 'Jack', gender: 'm', age: 38, bio: 'Easy to live with on a good day; finishes what they start; labels their food and means it; also cannot relax in a messy kitchen.', stats: { sharingTolerance: 4, cookingSkill: 12, tidiness: 16, handiness: 11, consideration: 10, sociability: 10, partyStamina: 12, workEthic: 17 } },
  { id: 30, name: 'Jade', gender: 'f', age: 31, bio: 'A reliable presence in the commune; happy to share gear and leftovers; is allergic to all-nighters; also finishes what they start.', stats: { sharingTolerance: 16, cookingSkill: 11, tidiness: 12, handiness: 10, consideration: 11, sociability: 11, partyStamina: 4, workEthic: 16 } },
  { id: 31, name: 'Jake', gender: 'm', age: 31, bio: 'Mostly chill, until something crosses a line; fixes what breaks before anyone notices; cannot do loud nights twice in a row; also turns plans into checklists and outcomes.', stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 10, handiness: 17, consideration: 11, sociability: 9, partyStamina: 5, workEthic: 16 } },
  { id: 32, name: 'James', gender: 'm', age: 30, bio: 'Friendly in their own way; turns plans into checklists and outcomes; survives on toast-level meals; also keeps surfaces clear and systems tidy.', stats: { sharingTolerance: 11, cookingSkill: 4, tidiness: 16, handiness: 12, consideration: 11, sociability: 10, partyStamina: 12, workEthic: 17 } },
  { id: 33, name: 'Jelena', gender: 'f', age: 32, bio: 'Low drama by default; shows up consistently, even for boring jobs; is allergic to all-nighters; also owns no tools and wants it that way.', stats: { sharingTolerance: 12, cookingSkill: 9, tidiness: 11, handiness: 4, consideration: 12, sociability: 12, partyStamina: 6, workEthic: 17 } },
  { id: 34, name: 'Josh', gender: 'm', age: 34, bio: 'A reliable presence in the commune; fixes what breaks before anyone notices; is allergic to all-nighters; also keeps chats short and sweet.', stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 10, handiness: 16, consideration: 11, sociability: 6, partyStamina: 5, workEthic: 12 } },
  { id: 35, name: 'Julia', gender: 'f', age: 36, bio: "Mostly chill, until something crosses a line; remembers everyone's preferences; is allergic to all-nighters; also owns no tools and wants it that way.", stats: { sharingTolerance: 12, cookingSkill: 12, tidiness: 11, handiness: 4, consideration: 16, sociability: 11, partyStamina: 6, workEthic: 11 } },
  { id: 36, name: 'Kat', gender: 'f', age: 27, bio: 'Brings a distinct energy to the house; finishes what they start; gets stressed when stuff is borrowed; also cannot relax in a messy kitchen.', stats: { sharingTolerance: 4, cookingSkill: 11, tidiness: 16, handiness: 12, consideration: 10, sociability: 12, partyStamina: 10, workEthic: 17 } },
  { id: 37, name: 'Katey', gender: 'f', age: 31, bio: 'Easy to live with on a good day; fixes what breaks before anyone notices; treats cooking as optional; also keeps the group chat alive.', stats: { sharingTolerance: 12, cookingSkill: 6, tidiness: 12, handiness: 17, consideration: 10, sociability: 16, partyStamina: 12, workEthic: 11 } },
  { id: 38, name: 'Kiara', gender: 'f', age: 36, bio: 'Low drama by default; makes proper communal dinners; labels their food and means it; also cannot relax in a messy kitchen.', stats: { sharingTolerance: 4, cookingSkill: 18, tidiness: 13, handiness: 11, consideration: 11, sociability: 10, partyStamina: 11, workEthic: 12 } },
  { id: 39, name: 'Lavinia', gender: 'f', age: 29, bio: 'Mostly chill, until something crosses a line; makes decisions with the group in mind; is allergic to all-nighters; also calls someone else when things break.', stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 12, handiness: 4, consideration: 17, sociability: 11, partyStamina: 6, workEthic: 12 } },
  { id: 40, name: 'Lily', gender: 'f', age: 36, bio: 'Brings a distinct energy to the house; shares without keeping score; cannot do loud nights twice in a row; also keeps surfaces clear and systems tidy.', stats: { sharingTolerance: 17, cookingSkill: 10, tidiness: 16, handiness: 10, consideration: 12, sociability: 11, partyStamina: 5, workEthic: 11 } },
  { id: 41, name: 'Lindsey', gender: 'f', age: 34, bio: 'Easy to live with on a good day; keeps surfaces clear and systems tidy; treats cooking as optional; also shows up consistently, even for boring jobs.', stats: { sharingTolerance: 12, cookingSkill: 6, tidiness: 16, handiness: 11, consideration: 11, sociability: 11, partyStamina: 10, workEthic: 17 } },
  { id: 42, name: 'Ludo', gender: 'm', age: 32, bio: 'Low drama by default; always has the right tool; cannot do loud nights twice in a row; also keeps chats short and sweet.', stats: { sharingTolerance: 11, cookingSkill: 9, tidiness: 10, handiness: 16, consideration: 12, sociability: 6, partyStamina: 5, workEthic: 11 } },
  { id: 43, name: 'Lynsey', gender: 'f', age: 30, bio: 'Friendly in their own way; shares without keeping score; taps out early, reliably; also does small clean-ups before they become problems.', stats: { sharingTolerance: 17, cookingSkill: 10, tidiness: 16, handiness: 11, consideration: 10, sociability: 10, partyStamina: 4, workEthic: 12 } },
  { id: 44, name: 'Maggie', gender: 'f', age: 29, bio: 'Easy to live with on a good day; makes proper communal dinners; starts clean-ups, rarely finishes them; also shares without keeping score.', stats: { sharingTolerance: 16, cookingSkill: 17, tidiness: 6, handiness: 10, consideration: 11, sociability: 12, partyStamina: 10, workEthic: 6 } },
  { id: 45, name: 'Marek', gender: 'm', age: 31, bio: 'Mostly chill, until something crosses a line; fixes what breaks before anyone notices; is allergic to all-nighters; also keeps chats short and sweet.', stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 12, handiness: 16, consideration: 12, sociability: 6, partyStamina: 5, workEthic: 12 } },
  { id: 46, name: 'Maria', gender: 'f', age: 32, bio: 'A reliable presence in the commune; makes proper communal dinners; needs clear boundaries around sharing; also finishes what they start.', stats: { sharingTolerance: 4, cookingSkill: 17, tidiness: 11, handiness: 12, consideration: 10, sociability: 11, partyStamina: 10, workEthic: 16 } },
  { id: 47, name: 'Martin', gender: 'm', age: 29, bio: 'Tends to keep their head down; keeps surfaces clear and systems tidy; survives on toast-level meals; also shows up consistently, even for boring jobs.', stats: { sharingTolerance: 12, cookingSkill: 4, tidiness: 17, handiness: 12, consideration: 10, sociability: 12, partyStamina: 12, workEthic: 16 } },
  { id: 48, name: 'Natalia', gender: 'f', age: 27, bio: 'Easy to live with on a good day; makes decisions with the group in mind; taps out early, reliably; also owns no tools and wants it that way.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 11, handiness: 4, consideration: 16, sociability: 12, partyStamina: 6, workEthic: 10 } },
  { id: 49, name: 'Natalie', gender: 'f', age: 31, bio: 'A reliable presence in the commune; cannot relax in a messy kitchen; is allergic to all-nighters; also shares without keeping score.', stats: { sharingTolerance: 17, cookingSkill: 10, tidiness: 16, handiness: 11, consideration: 12, sociability: 10, partyStamina: 4, workEthic: 11 } },
  { id: 50, name: 'Niel', gender: 'm', age: 28, bio: 'A bit of an acquired taste, but useful; turns plans into checklists and outcomes; labels their food and means it; also keeps surfaces clear and systems tidy.', stats: { sharingTolerance: 4, cookingSkill: 11, tidiness: 16, handiness: 11, consideration: 11, sociability: 10, partyStamina: 12, workEthic: 17 } },
  { id: 51, name: 'OBT', gender: 'm', age: 32, bio: 'Brings a distinct energy to the house; always knows what everyone is up to; survives on toast-level meals; also shows up consistently, even for boring jobs.', stats: { sharingTolerance: 12, cookingSkill: 6, tidiness: 11, handiness: 12, consideration: 11, sociability: 17, partyStamina: 12, workEthic: 16 } },
  { id: 52, name: 'Paula', gender: 'f', age: 29, bio: 'Low drama by default; makes decisions with the group in mind; is allergic to all-nighters; also keeps chats short and sweet.', stats: { sharingTolerance: 11, cookingSkill: 10, tidiness: 11, handiness: 10, consideration: 17, sociability: 6, partyStamina: 5, workEthic: 12 } },
  { id: 53, name: 'Pauline', gender: 'f', age: 33, bio: 'Friendly in their own way; keeps surfaces clear and systems tidy; treats cooking as optional; also keeps chats short and sweet.', stats: { sharingTolerance: 12, cookingSkill: 6, tidiness: 16, handiness: 11, consideration: 11, sociability: 6, partyStamina: 10, workEthic: 12 } },
  { id: 54, name: 'Pegah', gender: 'f', age: 33, bio: 'Mostly chill, until something crosses a line; notices moods and checks in early; taps out early, reliably; also is scared of drills.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 11, handiness: 4, consideration: 17, sociability: 10, partyStamina: 6, workEthic: 12 } },
  { id: 55, name: 'Rob', gender: 'm', age: 38, bio: 'A reliable presence in the commune; always has the right tool; cannot do loud nights twice in a row; also shows up consistently, even for boring jobs.', stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 11, handiness: 17, consideration: 10, sociability: 9, partyStamina: 5, workEthic: 16 } },
  { id: 56, name: 'Rob Long', gender: 'm', age: 31, bio: 'Low drama by default; fixes what breaks before anyone notices; is allergic to all-nighters; also finishes what they start.', stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 11, handiness: 16, consideration: 10, sociability: 10, partyStamina: 6, workEthic: 17 } },
  { id: 57, name: 'Romy', gender: 'f', age: 32, bio: 'Mostly chill, until something crosses a line; keeps surfaces clear and systems tidy; orders in before considering the fridge; also shows up consistently, even for boring jobs.', stats: { sharingTolerance: 11, cookingSkill: 6, tidiness: 17, handiness: 11, consideration: 10, sociability: 10, partyStamina: 12, workEthic: 16 } },
  { id: 58, name: 'Rory', gender: 'm', age: 28, bio: 'Brings a distinct energy to the house; always knows what everyone is up to; has a second wind at midnight; also works in bursts, not routines; but leaves a trail of mugs and laundry.', stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 6, handiness: 10, consideration: 10, sociability: 17, partyStamina: 16, workEthic: 7 } },
  { id: 59, name: 'Ruben', gender: 'm', age: 37, bio: 'Low drama by default; always has the right tool; cannot do loud nights twice in a row; also keeps chats short and sweet.', stats: { sharingTolerance: 11, cookingSkill: 9, tidiness: 11, handiness: 16, consideration: 12, sociability: 6, partyStamina: 5, workEthic: 12 } },
  { id: 60, name: 'Sam', gender: 'm', age: 30, bio: 'A reliable presence in the commune; turns plans into checklists and outcomes; taps out early, reliably; also calls someone else when things break.', stats: { sharingTolerance: 12, cookingSkill: 9, tidiness: 10, handiness: 6, consideration: 11, sociability: 12, partyStamina: 4, workEthic: 17 } },
  { id: 61, name: 'Saskia', gender: 'f', age: 31, bio: 'Easy to live with on a good day; shares without keeping score; is allergic to all-nighters; also does small clean-ups before they become problems.', stats: { sharingTolerance: 17, cookingSkill: 10, tidiness: 16, handiness: 10, consideration: 11, sociability: 10, partyStamina: 4, workEthic: 12 } },
  { id: 62, name: 'Scarlette', gender: 'f', age: 35, bio: "Brings a distinct energy to the house; treats weeknights like weekends; can't see mess until it's catastrophic; also is friendly, but rarely joins in.", stats: { sharingTolerance: 11, cookingSkill: 10, tidiness: 5, handiness: 12, consideration: 10, sociability: 17, partyStamina: 16, workEthic: 9 } },
  { id: 63, name: 'Sean', gender: 'm', age: 31, bio: 'Friendly in their own way; fixes what breaks before anyone notices; cannot do loud nights twice in a row; also turns plans into checklists and outcomes.', stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 10, handiness: 17, consideration: 10, sociability: 9, partyStamina: 5, workEthic: 16 } },
  { id: 64, name: 'Shane', gender: 'm', age: 31, bio: 'Mostly chill, until something crosses a line; makes friends in the hallway; treats cooking as optional; also shows up consistently, even for boring jobs.', stats: { sharingTolerance: 11, cookingSkill: 6, tidiness: 10, handiness: 11, consideration: 10, sociability: 16, partyStamina: 12, workEthic: 16 } },
  { id: 65, name: 'Simon', gender: 'm', age: 27, bio: 'A reliable presence in the commune; shows up consistently, even for boring jobs; gets stressed when stuff is borrowed; also can barely assemble flat-pack.', stats: { sharingTolerance: 4, cookingSkill: 10, tidiness: 10, handiness: 6, consideration: 11, sociability: 12, partyStamina: 11, workEthic: 17 } },
  { id: 66, name: 'Sophie', gender: 'f', age: 31, bio: "Mostly chill, until something crosses a line; remembers everyone's preferences; is allergic to all-nighters; also calls someone else when things break.", stats: { sharingTolerance: 10, cookingSkill: 11, tidiness: 10, handiness: 4, consideration: 16, sociability: 12, partyStamina: 6, workEthic: 12 } },
  { id: 67, name: 'Stacy', gender: 'f', age: 33, bio: "Brings a distinct energy to the house; keeps the group chat alive; has a second wind at midnight; also treats cooking as optional; but procrastinates until it's urgent.", stats: { sharingTolerance: 11, cookingSkill: 6, tidiness: 10, handiness: 10, consideration: 10, sociability: 16, partyStamina: 17, workEthic: 7 } },
  { id: 68, name: 'Stephen', gender: 'm', age: 31, bio: 'Mostly chill, until something crosses a line; finishes what they start; taps out early, reliably; also owns no tools and wants it that way.', stats: { sharingTolerance: 10, cookingSkill: 9, tidiness: 10, handiness: 4, consideration: 11, sociability: 11, partyStamina: 6, workEthic: 17 } },
  { id: 69, name: 'Steve', gender: 'm', age: 31, bio: 'Friendly in their own way; turns plans into checklists and outcomes; taps out early, reliably; also calls someone else when things break.', stats: { sharingTolerance: 12, cookingSkill: 9, tidiness: 10, handiness: 6, consideration: 11, sociability: 12, partyStamina: 4, workEthic: 17 } },
  { id: 70, name: 'Tessa', gender: 'f', age: 27, bio: 'A bit of an acquired taste, but useful; keeps surfaces clear and systems tidy; is allergic to all-nighters; also needs clear boundaries around sharing.', stats: { sharingTolerance: 4, cookingSkill: 10, tidiness: 17, handiness: 10, consideration: 10, sociability: 9, partyStamina: 5, workEthic: 12 } },
  { id: 71, name: 'Thabo', gender: 'm', age: 31, bio: 'Low drama by default; always has the right tool; taps out early, reliably; also labels their food and means it.', stats: { sharingTolerance: 4, cookingSkill: 10, tidiness: 11, handiness: 16, consideration: 10, sociability: 12, partyStamina: 6, workEthic: 12 } },
  { id: 72, name: 'Theo', gender: 'm', age: 31, bio: 'Easy to live with on a good day; makes proper communal dinners; gets stressed when stuff is borrowed; also cannot relax in a messy kitchen.', stats: { sharingTolerance: 4, cookingSkill: 18, tidiness: 16, handiness: 11, consideration: 12, sociability: 9, partyStamina: 10, workEthic: 11 } },
  { id: 73, name: 'Tim', gender: 'm', age: 32, bio: "A bit of an acquired taste, but useful; cannot relax in a messy kitchen; labels their food and means it; also remembers everyone's preferences.", stats: { sharingTolerance: 13, cookingSkill: 11, tidiness: 16, handiness: 11, consideration: 18, sociability: 3, partyStamina: 7, workEthic: 11 } },
  { id: 74, name: 'Tom', gender: 'm', age: 41, bio: 'Brings a distinct energy to the house; turns plans into checklists and outcomes; has a complicated relationship with pans; also always knows what everyone is up to.', stats: { sharingTolerance: 12, cookingSkill: 6, tidiness: 12, handiness: 12, consideration: 11, sociability: 16, partyStamina: 9, workEthic: 16 } },
  { id: 75, name: 'Vera', gender: 'f', age: 34, bio: 'Easy to live with on a good day; builds shelves for fun; is allergic to all-nighters; also steady and self-driven.', stats: { sharingTolerance: 9, cookingSkill: 9, tidiness: 10, handiness: 16, consideration: 9, sociability: 3, partyStamina: 5, workEthic: 16 } },
  { id: 76, name: 'Will', gender: 'm', age: 44, bio: 'A reliable presence in the commune; labels shelves and actually uses the labels; survives on toast-level meals.', stats: { sharingTolerance: 13, cookingSkill: 4, tidiness: 19, handiness: 13, consideration: 11, sociability: 13, partyStamina: 13, workEthic: 12 } }
];

const DEFAULT_BUILDINGS = [
  {
    id: 'bedroom', name: 'Bedrooms', capacity: 2, atStart: 8, cost: 200,
    utilitiesMultiplier: 0.1, groundRentMultiplier: 0.1, buildable: true,
    quality: 1, recoveryMult: 1.0
  },
  {
    id: 'kitchen', name: 'Kitchen', capacity: 20, atStart: 1, cost: null,
    utilitiesMultiplier: null, groundRentMultiplier: null, buildable: false,
    quality: 1, foodMult: 1.0, messMult: 1.2
  },
  {
    id: 'bathroom', name: 'Bathroom', capacity: 4, atStart: 3, cost: 300,
    utilitiesMultiplier: 0.2, groundRentMultiplier: 0.1, buildable: true,
    quality: 1, cleanMult: 1.0, messMult: 1.4
  },
  {
    id: 'living_room', name: 'Living Room', capacity: 20, atStart: 1, cost: null,
    utilitiesMultiplier: null, groundRentMultiplier: null, buildable: false,
    quality: 1, funMult: 1.0, noiseMult: 1.0
  },
  {
    id: 'utility_closet', name: 'Utility Closet', capacity: 40, atStart: 1, cost: null,
    utilitiesMultiplier: null, groundRentMultiplier: null, buildable: false,
    quality: 1, repairMult: 1.0
  },
  {
    id: 'great_hall', name: 'Great Hall', capacity: 30, atStart: 0, cost: null,
    utilitiesMultiplier: null, groundRentMultiplier: null, buildable: false,
    quality: 2.0,
    techRequired: 'great_hall', isUpgrade: true, upgradeOf: 'living_room'
  },
  {
    id: 'heaven', name: 'Heaven', capacity: 15, atStart: 0, cost: 500,
    utilitiesMultiplier: 0.1, groundRentMultiplier: 0.05, buildable: true,
    quality: 1, funOutput: 3, techRequired: 'blanket_fort'
  },
  {
    id: 'hot_tub', name: 'Hot Tub', capacity: 8, atStart: 0, cost: 800,
    utilitiesMultiplier: 0.15, groundRentMultiplier: 0.05, buildable: true,
    quality: 1, funOutput: 2, techRequired: 'outdoor_plumbing'
  }
];

const DEFAULT_TIER_CONFIG = {
  "brackets": [
    6,
    12,
    20,
    50,
    100
  ],
  "outputMults": [
    1,
    1.15,
    1.3,
    1.5,
    1.75,
    2
  ],
  "healthMults": [
    1,
    1.1,
    1.2,
    1.35,
    1.5,
    1.7
  ],
  "qualityCaps": [
    2,
    3,
    4,
    5,
    5,
    5
  ]
};

const DEFAULT_POLICY_CONFIG = {
  "excludePercent": 0.25,
  "funPenalty": {
    "threshold": 3,
    "K": 0.15,
    "P": 1.5
  }
};

const POLICY_DEFINITIONS = [
  {
    id: 'cooking_rota',
    name: 'Cooking Rota',
    description: 'Remove worst {pct}% of residents\' cooking stats from the house resident multiplier',
    primitive: 'nutrition',
    stat: 'cookingSkill',
    type: 'exclude_worst',
    techRequired: 'chores_rota'
  },
  {
    id: 'cleaning_rota',
    name: 'Cleaning Rota',
    description: 'Remove worst {pct}% of residents\' tidiness stats from the house resident multiplier',
    primitive: 'cleanliness',
    stat: 'tidiness',
    type: 'exclude_worst',
    techRequired: 'chores_rota'
  },
  {
    id: 'ocado',
    name: 'Ocado',
    description: 'Boost ingredient budget efficiency by {ocadoPct}%',
    primitive: 'nutrition',
    stat: null,
    type: 'boost_efficiency',
    techRequired: 'ocado'
  }
];

const TECH_TREE = [
  { id: 'chores_rota', name: 'Chores Rota', level: 1, tree: 'livingStandards', type: 'policy', parent: null, description: 'Commune learns how to organise better', available: true },
  { id: 'cleaner', name: 'Cleaner', level: 2, tree: 'livingStandards', type: 'fixed_expense', parent: 'chores_rota', description: 'Employ some professional help', available: true },
  { id: 'laundry_room', name: 'Laundry Room', level: 3, tree: 'livingStandards', type: 'building', parent: 'cleaner', description: 'Operationalising', available: false },
  { id: 'ukrainian_cleaner', name: 'Ukrainian Cleaner (Upgrade)', level: 3, tree: 'livingStandards', type: 'upgrade', parent: 'cleaner', description: 'Cleaner upgrade', available: false },
  { id: 'ocado', name: 'Ocado', level: 2, tree: 'livingStandards', type: 'policy', parent: 'chores_rota', description: 'More efficient ingredients', available: true },
  { id: 'competitive_cooking', name: 'Competitive Cooking', level: 3, tree: 'livingStandards', type: 'policy', parent: 'ocado', description: 'Fun culture of cooking to impress emerges', available: false },
  { id: 'majestic_guvnor', name: "Majestic/Guv'nor", level: 3, tree: 'livingStandards', type: 'culture', parent: 'ocado', description: "House special - don't mind if I do... (wine)", available: false },
  { id: 'starlink', name: 'Starlink', level: 1, tree: 'productivity', type: 'fixed_expense', parent: null, description: 'Faster internet (thanks Elon)', available: true },
  { id: 'wellness', name: 'Wellness', level: 2, tree: 'productivity', type: 'culture', parent: 'starlink', description: 'Ways to reduce fatigue', available: true },
  { id: 'group_yoga', name: 'Group Yoga', level: 3, tree: 'productivity', type: 'culture', parent: 'wellness', description: 'It was the answer all along...', available: false },
  { id: 'sauna', name: 'Sauna', level: 3, tree: 'productivity', type: 'building', parent: 'wellness', description: 'Skandi style', available: false },
  { id: 'great_hall', name: 'Great Hall', level: 2, tree: 'productivity', type: 'upgrade', parent: 'starlink', description: 'Living room upgrade', available: true },
  { id: 'call_rooms', name: 'Bookable Call Rooms', level: 3, tree: 'productivity', type: 'policy', parent: 'great_hall', description: 'Shhhh', available: false },
  { id: 'adderall', name: 'Adderall', level: 3, tree: 'productivity', type: 'fixed_expense', parent: 'great_hall', description: "LET'S FUCKING GO", available: false },
  { id: 'blanket_fort', name: 'Blanket Fort Engineering', level: 1, tree: 'fun', type: 'building', parent: null, description: 'Discovering heaven - the pillow fort for grown ups', available: true },
  { id: 'always_be_escalating', name: 'Always Be Escalating', level: 2, tree: 'fun', type: 'culture', parent: 'blanket_fort', description: 'Unlocks new fun techs', available: true },
  { id: 'party_planning', name: 'Party Planning', level: 3, tree: 'fun', type: 'culture', parent: 'always_be_escalating', description: "Guys I've had an idea...", available: false },
  { id: 'psychedelics', name: 'Psychedelics', level: 3, tree: 'fun', type: 'fixed_expense', parent: 'always_be_escalating', description: "Let's expand the discussion", available: false },
  { id: 'outdoor_plumbing', name: 'Outdoor Plumbing', level: 2, tree: 'fun', type: 'building', parent: 'blanket_fort', description: "Let's figure out how to make a hot tub...", available: true },
  { id: 'polyamory', name: 'Polyamory', level: 3, tree: 'fun', type: 'policy', parent: 'outdoor_plumbing', description: 'I mean... why not?', available: false },
  { id: 'advanced_blanket_fort', name: 'Advanced Blanket Fort Engineering', level: 3, tree: 'fun', type: 'building', parent: 'outdoor_plumbing', description: "Let's double down", available: false }
];

const DEFAULT_TECH_CONFIG = {
  "chores_rota": {
    "cost": 500,
    "effectPercent": 15
  },
  "cleaner": {
    "cost": 1000,
    "weeklyCost": 150,
    "effectPercent": 40
  },
  "ocado": {
    "cost": 1000,
    "effectPercent": 15
  },
  "wellness": {
    "cost": 1000,
    "effectPercent": 20
  },
  "great_hall": {
    "cost": 1000
  },
  "starlink": {
    "cost": 500,
    "weeklyCost": 100,
    "effectPercent": 15
  },
  "blanket_fort": {
    "cost": 500
  },
  "always_be_escalating": {
    "cost": 1000
  },
  "outdoor_plumbing": {
    "cost": 1000
  },
  "laundry_room": {
    "cost": 2000
  },
  "ukrainian_cleaner": {
    "cost": 2000
  },
  "competitive_cooking": {
    "cost": 2000
  },
  "majestic_guvnor": {
    "cost": 2000
  },
  "group_yoga": {
    "cost": 2000
  },
  "sauna": {
    "cost": 2000
  },
  "call_rooms": {
    "cost": 2000
  },
  "adderall": {
    "cost": 2000,
    "weeklyCost": 200,
    "effectPercent": 25
  },
  "party_planning": {
    "cost": 2000
  },
  "psychedelics": {
    "cost": 2000,
    "weeklyCost": 200,
    "effectPercent": 20
  },
  "polyamory": {
    "cost": 2000
  },
  "advanced_blanket_fort": {
    "cost": 2000
  }
};

const DEFAULT_PRIMITIVE_CONFIG = {
  "penaltyK": 2,
  "penaltyP": 2,
  "penaltyOnset": 0.75,
  "recoveryDamping": 0.65,
  "crowding": {
    "baseMult": 43,
    "shareTolCoeff": 0.25,
    "weight": 1,
    "useCustomPenalty": false,
    "penaltyK": 2,
    "penaltyP": 2
  },
  "noise": {
    "baseSocial": 2.25,
    "baseAmbient": 10,
    "socioMult": 0.25,
    "considMult": 0.25,
    "useCustomPenalty": false,
    "penaltyK": 2,
    "penaltyP": 2
  },
  "nutrition": {
    "outputRate": 7.3,
    "consumptionRate": 13,
    "skillMult": 0.25,
    "useCustomPenalty": false,
    "penaltyK": 2,
    "penaltyP": 2
  },
  "cleanliness": {
    "messPerResident": 0.1,
    "cleanBase": 0.52,
    "skillMult": 0.25,
    "useCustomPenalty": false,
    "penaltyK": 2,
    "penaltyP": 2
  },
  "maintenance": {
    "wearPerResident": 0.08,
    "repairBase": 0.54,
    "handinessCoeff": 0.25,
    "tidinessCoeff": 0.12,
    "useCustomPenalty": true,
    "penaltyK": 4,
    "penaltyP": 3
  },
  "fatigue": {
    "exertBase": 0.59,
    "recoverBase": 0.51,
    "workMult": 0.25,
    "socioMult": 0.25,
    "partyCoeff": 0.25,
    "funFatigueCoeff": 0.005,
    "driveFatigueCoeff": 0.005
  },
  "fun": {
    "outputRate": 9.2,
    "consumptionRate": 16,
    "skillMult": 0.25,
    "considerationPenalty": 0.12,
    "useCustomPenalty": false,
    "penaltyK": 2,
    "penaltyP": 2
  },
  "drive": {
    "outputRate": 6.3,
    "slackRate": 11,
    "skillMult": 0.25,
    "useCustomPenalty": false,
    "penaltyK": 2,
    "penaltyP": 2
  }
};

const DEFAULT_HEALTH_CONFIG = {
  "livingStandards": {
    "nutritionWeight": 0.5,
    "cleanlinessDampen": 0.35,
    "crowdingDampen": 0.35,
    "maintenanceDampen": 0.35,
    "rentCurve": 0.7,
    "rentTierCurvature": 2,
    "useCustomScaling": true,
    "ref0": 0.55,
    "alpha": 0.15,
    "p": 2,
    "tierMult": [
      1,
      1.1,
      1.2,
      1.35,
      1.5,
      1.7
    ]
  },
  "productivity": {
    "driveWeight": 1,
    "noiseWeight": 0.35,
    "crowdingWeight": 0.25,
    "useCustomScaling": false,
    "ref0": 0.3,
    "alpha": 0.15,
    "p": 2,
    "tierMult": [
      1,
      1.1,
      1.2,
      1.35,
      1.5,
      1.7
    ]
  },
  "partytime": {
    "funWeight": 1,
    "useCustomScaling": true,
    "ref0": 0.42,
    "alpha": 0.15,
    "p": 2,
    "tierMult": [
      1,
      1.1,
      1.2,
      1.35,
      1.5,
      1.7
    ]
  },
  "globalScaling": {
    "ref0": 0.35,
    "alpha": 0.15,
    "p": 2
  },
  "pop0": 2,
  "tierBrackets": [
    6,
    12,
    20,
    50,
    100
  ],
  "baseFatigueWeight": 0.5,
  "fatigueWeightSwing": 0.5,
  "churnBaselinePR": 24,
  "churnScalePerPoint": 0.01,
  "recruitBaselinePT": 35,
  "recruitScalePerSlot": 15,
  "baseRecruitSlots": 1
};

const DEFAULT_VIBES_CONFIG = {
  "balancedThreshold": 0.18,
  "strongImbalanceThreshold": 0.3,
  "tierThresholds": [
    {
      "name": "Shambles",
      "min": 0,
      "max": 0.15
    },
    {
      "name": "Rough",
      "min": 0.15,
      "max": 0.25
    },
    {
      "name": "Scrappy",
      "min": 0.25,
      "max": 0.35
    },
    {
      "name": "Fine",
      "min": 0.35,
      "max": 0.45
    },
    {
      "name": "Good",
      "min": 0.45,
      "max": 0.55
    },
    {
      "name": "Lovely",
      "min": 0.55,
      "max": 0.65
    },
    {
      "name": "Thriving",
      "min": 0.65,
      "max": 0.75
    },
    {
      "name": "Wonderful",
      "min": 0.75,
      "max": 0.85
    },
    {
      "name": "Glorious",
      "min": 0.85,
      "max": 0.95
    },
    {
      "name": "Utopia",
      "min": 0.95,
      "max": 1.01
    }
  ],
  "scaleBreakpoints": [
    {
      "min": 1,
      "max": 5,
      "tierMin": 2,
      "tierMax": 5
    },
    {
      "min": 6,
      "max": 10,
      "tierMin": 2,
      "tierMax": 6
    },
    {
      "min": 11,
      "max": 20,
      "tierMin": 2,
      "tierMax": 7
    },
    {
      "min": 21,
      "max": 35,
      "tierMin": 1,
      "tierMax": 8
    },
    {
      "min": 36,
      "max": 999,
      "tierMin": 0,
      "tierMax": 9
    }
  ],
  "branchLabels": {
    "highPartytime": {
      "mild": "Party House",
      "strong": "Party Mansion"
    },
    "highProductivity": {
      "mild": "Grind House",
      "strong": "Sweat Shop"
    },
    "highLivingStandards": {
      "mild": "Showhome",
      "strong": "Dolls House"
    },
    "lowLivingStandards": {
      "mild": "Shanty Town",
      "strong": "Slum"
    },
    "lowProductivity": {
      "mild": "Decadent",
      "strong": "Chaotic"
    },
    "lowPartytime": {
      "mild": "Low Energy",
      "strong": "Dead"
    }
  }
};

const DEFAULT_BUDGET_CONFIG = {
  "curve": {
    "basePerCapita": 2,
    "scaleExp": 0.7,
    "floor": 0.5,
    "ceiling": 1.5
  },
  "nutrition": {
    "key": "nutrition",
    "label": "Ingredients",
    "basePerCapita": 44
  },
  "cleanliness": {
    "key": "cleanliness",
    "label": "Cleaning supplies",
    "basePerCapita": 10
  },
  "maintenance": {
    "key": "maintenance",
    "label": "Repairs & tools",
    "basePerCapita": 18
  },
  "fatigue": {
    "key": "fatigue",
    "label": "Wellness",
    "basePerCapita": 10
  },
  "fun": {
    "key": "fun",
    "label": "Entertainment",
    "basePerCapita": 26
  },
  "drive": {
    "key": "drive",
    "label": "Internet & workspace",
    "basePerCapita": 14
  }
};

const INITIAL_DEFAULTS = {
  startingTreasury: 0,
  startingResidents: 4,
  buildsPerWeek: 1,
  policyChangesPerWeek: 1,
  researchActionsPerWeek: 1,
  rentMin: 50,
  rentMax: 500,
  defaultRent: 150,
  groundRentBase: 700,
  utilitiesBase: 250,
  baseChurnRate: 0.07,
  churnRentMultiplier: 0.0003,
  gameOverLimit: -5000,
  tickSpeed: 200,
  hoursPerTick: 4,
  startingBudgets: {
    nutrition: 75,
    cleanliness: 20,
    maintenance: 30,
    fatigue: 20,
    fun: 45,
    drive: 25
  },
  primitives: { ...DEFAULT_PRIMITIVE_CONFIG },
  health: { ...DEFAULT_HEALTH_CONFIG },
  vibes: { ...DEFAULT_VIBES_CONFIG },
  tierConfig: { ...DEFAULT_TIER_CONFIG }
};

const DEFAULT_PRIMITIVE_LABELS = {
  coverage: {
    nutrition: {
      thresholds: [25, 45, 60, 75, 90],
      labels: ['Starving', 'Fed', 'Well Fed', 'Feasting', 'Gourmet', 'Michelin Starred']
    },
    fun: {
      thresholds: [25, 45, 60, 75, 90],
      labels: ['Boring', 'Buzzy', 'Good Times', 'Boomtown', 'Life Changing', 'Legendary']
    },
    drive: {
      thresholds: [25, 45, 60, 75, 90],
      labels: ['Idle', 'Motivated', 'Driven', 'On Fire', 'Unstoppable', 'World Domination']
    }
  },
  accumulator: {
    cleanliness: {
      thresholds: [16, 31, 51, 71, 86],
      labels: ['Sparkling', 'Lived In', 'Grubby', 'Filthy', 'Tip', 'Biohazard']
    },
    maintenance: {
      thresholds: [16, 31, 51, 71, 86],
      labels: ['Shipshape', 'Solid Enough', 'Weathered', 'Crumbling', 'Derelict', 'Condemned']
    },
    fatigue: {
      thresholds: [16, 31, 51, 71, 86],
      labels: ['Fresh', 'Fine', 'Tired', 'Shattered', 'Zombies', 'Comatose']
    }
  }
};

const DEFAULT_SCORE_CONFIG = {
  weeklyFormula: {
    scale: 10,
    harmonyFloor: 0.7,
    harmonyWeight: 0.3,
    popScaleBrackets: [
      { maxN: 4, mult: 1.0 },
      { maxN: 8, mult: 1.5 },
      { maxN: 12, mult: 2.0 },
      { maxN: Infinity, mult: 3.0 }
    ]
  }
};

const MILESTONE_DEFINITIONS = [
  // Population
  { id: 'pop_5', category: 'population', badgeName: 'Open Doors', points: 100, flavour: 'Someone new moved in', condition: { type: 'population', min: 5 } },
  { id: 'pop_8', category: 'population', badgeName: 'Growing', points: 200, flavour: 'The commune is filling up', condition: { type: 'population', min: 8 } },
  { id: 'pop_12', category: 'population', badgeName: 'Established', points: 400, flavour: 'A proper commune now', condition: { type: 'population', min: 12 } },
  { id: 'pop_16', category: 'population', badgeName: 'Full House', points: 750, flavour: 'Every bed has a llama', condition: { type: 'population', min: 16 } },
  { id: 'zero_churn_4', category: 'population', badgeName: 'Stable Community', points: 300, flavour: 'Nobody wants to leave', condition: { type: 'zeroChurnStreak', min: 4 } },

  // Vibes
  { id: 'vibes_25', category: 'vibes', badgeName: 'Scrappy', points: 50, flavour: 'Getting by', condition: { type: 'vibes', min: 25 } },
  { id: 'vibes_35', category: 'vibes', badgeName: 'Fine', points: 100, flavour: 'Things are okay', condition: { type: 'vibes', min: 35 } },
  { id: 'vibes_45', category: 'vibes', badgeName: 'Good', points: 200, flavour: 'Genuinely pleasant', condition: { type: 'vibes', min: 45 } },
  { id: 'vibes_55', category: 'vibes', badgeName: 'Lovely', points: 400, flavour: 'A lovely place to live', condition: { type: 'vibes', min: 55 } },
  { id: 'vibes_65', category: 'vibes', badgeName: 'Thriving', points: 600, flavour: 'The commune is thriving', condition: { type: 'vibes', min: 65 } },
  { id: 'vibes_75', category: 'vibes', badgeName: 'Wonderful', points: 800, flavour: 'Something special', condition: { type: 'vibes', min: 75 } },
  { id: 'vibes_85', category: 'vibes', badgeName: 'Glorious', points: 1000, flavour: 'A beacon of communal living', condition: { type: 'vibes', min: 85 } },
  { id: 'vibes_95', category: 'vibes', badgeName: 'Utopia', points: 2000, flavour: 'Perfection achieved', condition: { type: 'vibes', min: 95 } },

  // Reputation
  { id: 'rep_reputable', category: 'reputation', badgeName: 'Reputable', points: 150, flavour: 'People have heard of this place', condition: { type: 'reputation', name: 'Reputable' } },
  { id: 'rep_aspirational', category: 'reputation', badgeName: 'Aspirational', points: 400, flavour: 'People aspire to live here', condition: { type: 'reputation', name: 'Aspirational' } },
  { id: 'rep_famous', category: 'reputation', badgeName: 'Famous', points: 800, flavour: 'Everyone knows Fort Llama', condition: { type: 'reputation', name: 'Famous' } },
  { id: 'rep_mythical', category: 'reputation', badgeName: 'Mythical', points: 2000, flavour: 'The stuff of legend', condition: { type: 'reputation', name: 'Mythical' } },

  // Economic
  { id: 'econ_breakeven', category: 'economic', badgeName: 'Breaking Even', points: 150, flavour: 'No longer bleeding money', condition: { type: 'weeklyDelta', min: 0 } },
  { id: 'econ_black', category: 'economic', badgeName: 'Out of the Red', points: 300, flavour: 'Debt free at last', condition: { type: 'treasury', min: 0 } },
  { id: 'econ_2k', category: 'economic', badgeName: 'Rainy Day Fund', points: 500, flavour: 'A cushion for hard times', condition: { type: 'treasury', min: 2000 } },
  { id: 'econ_5k', category: 'economic', badgeName: 'Flush', points: 750, flavour: 'The commune is thriving financially', condition: { type: 'treasury', min: 5000 } },

  // Building
  { id: 'build_first', category: 'building', badgeName: 'Expanding', points: 100, flavour: 'Breaking ground', condition: { type: 'building', any: true } },
  { id: 'build_heaven', category: 'building', badgeName: 'Pillow Paradise', points: 250, flavour: 'Blanket fort heaven is real', condition: { type: 'building', id: 'heaven' } },
  { id: 'build_hot_tub', category: 'building', badgeName: 'Bubbles', points: 250, flavour: 'Outdoor luxury', condition: { type: 'building', id: 'hot_tub' } },

  // Branch
  { id: 'branch_showhome', category: 'branch', badgeName: 'Showhome', points: 100, flavour: 'Living standards are the star', condition: { type: 'branch', label: 'Showhome' } },
  { id: 'branch_party_house', category: 'branch', badgeName: 'Party House', points: 100, flavour: 'Good times are the star', condition: { type: 'branch', label: 'Party House' } },
  { id: 'branch_grind_house', category: 'branch', badgeName: 'Grind House', points: 100, flavour: 'Productivity is the star', condition: { type: 'branch', label: 'Grind House' } },
  { id: 'branch_dolls_house', category: 'branch', badgeName: 'Dolls House', points: 200, flavour: 'Living standards dominate everything', condition: { type: 'branch', label: 'Dolls House' } },
  { id: 'branch_party_mansion', category: 'branch', badgeName: 'Party Mansion', points: 200, flavour: 'This commune runs on fun', condition: { type: 'branch', label: 'Party Mansion' } },
  { id: 'branch_sweat_shop', category: 'branch', badgeName: 'Sweat Shop', points: 200, flavour: 'All work, no play', condition: { type: 'branch', label: 'Sweat Shop' } },

  // Survival
  { id: 'survive_10', category: 'survival', badgeName: 'Still Standing', points: 100, flavour: 'You made it past the danger zone', condition: { type: 'week', min: 10 } },
  { id: 'survive_25', category: 'survival', badgeName: 'Veteran', points: 300, flavour: 'Half a year of communal living', condition: { type: 'week', min: 25 } },
  { id: 'survive_52', category: 'survival', badgeName: 'One Year', points: 750, flavour: 'A full year — remarkable', condition: { type: 'week', min: 52 } },

  // Culture — Tech Badges (badgeName TBC — user is working on these)
  { id: 'tech_chores_rota', category: 'culture', badgeName: 'TBC', points: 100, flavour: 'TBC', condition: { type: 'tech', techId: 'chores_rota' } },
  { id: 'tech_starlink', category: 'culture', badgeName: 'TBC', points: 100, flavour: 'TBC', condition: { type: 'tech', techId: 'starlink' } },
  { id: 'tech_blanket_fort', category: 'culture', badgeName: 'TBC', points: 100, flavour: 'TBC', condition: { type: 'tech', techId: 'blanket_fort' } },
  { id: 'tech_cleaner', category: 'culture', badgeName: 'TBC', points: 250, flavour: 'TBC', condition: { type: 'tech', techId: 'cleaner' } },
  { id: 'tech_ocado', category: 'culture', badgeName: 'TBC', points: 250, flavour: 'TBC', condition: { type: 'tech', techId: 'ocado' } },
  { id: 'tech_wellness', category: 'culture', badgeName: 'TBC', points: 250, flavour: 'TBC', condition: { type: 'tech', techId: 'wellness' } },
  { id: 'tech_great_hall', category: 'culture', badgeName: 'TBC', points: 250, flavour: 'TBC', condition: { type: 'tech', techId: 'great_hall' } },
  { id: 'tech_always_be_escalating', category: 'culture', badgeName: 'TBC', points: 250, flavour: 'TBC', condition: { type: 'tech', techId: 'always_be_escalating' } },
  { id: 'tech_outdoor_plumbing', category: 'culture', badgeName: 'TBC', points: 250, flavour: 'TBC', condition: { type: 'tech', techId: 'outdoor_plumbing' } },
  { id: 'tech_laundry_room', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'laundry_room' } },
  { id: 'tech_ukrainian_cleaner', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'ukrainian_cleaner' } },
  { id: 'tech_competitive_cooking', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'competitive_cooking' } },
  { id: 'tech_majestic_guvnor', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'majestic_guvnor' } },
  { id: 'tech_group_yoga', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'group_yoga' } },
  { id: 'tech_sauna', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'sauna' } },
  { id: 'tech_call_rooms', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'call_rooms' } },
  { id: 'tech_adderall', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'adderall' } },
  { id: 'tech_party_planning', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'party_planning' } },
  { id: 'tech_psychedelics', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'psychedelics' } },
  { id: 'tech_polyamory', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'polyamory' } },
  { id: 'tech_advanced_blanket_fort', category: 'culture', badgeName: 'TBC', points: 500, flavour: 'TBC', condition: { type: 'tech', techId: 'advanced_blanket_fort' } }
];

module.exports = {
  DAY_NAMES,
  STARTING_LLAMAS,
  DEFAULT_BUILDINGS,
  DEFAULT_TIER_CONFIG,
  DEFAULT_POLICY_CONFIG,
  POLICY_DEFINITIONS,
  TECH_TREE,
  DEFAULT_TECH_CONFIG,
  DEFAULT_PRIMITIVE_CONFIG,
  DEFAULT_HEALTH_CONFIG,
  DEFAULT_VIBES_CONFIG,
  DEFAULT_BUDGET_CONFIG,
  DEFAULT_PRIMITIVE_LABELS,
  DEFAULT_SCORE_CONFIG,
  MILESTONE_DEFINITIONS,
  INITIAL_DEFAULTS
};
