const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const SAVED_DEFAULTS_FILE = path.join(__dirname, 'saved-defaults.json');
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let gameState = null;
let gameConfig = null;
let simulationInterval = null;

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
  { id: 19, name: 'Florence', gender: 'f', age: 31, bio: 'Friendly in their own way; remembers everyone\'s preferences; cannot do loud nights twice in a row; also fixes what breaks before anyone notices; but starts clean-ups, rarely finishes them.', stats: { sharingTolerance: 12, cookingSkill: 11, tidiness: 6, handiness: 16, consideration: 16, sociability: 9, partyStamina: 5, workEthic: 9 } },
  { id: 20, name: 'Florian', gender: 'm', age: 33, bio: 'Mostly chill, until something crosses a line; fixes what breaks before anyone notices; labels their food and means it; also struggles with follow-through.', stats: { sharingTolerance: 4, cookingSkill: 12, tidiness: 11, handiness: 16, consideration: 10, sociability: 12, partyStamina: 11, workEthic: 6 } },
  { id: 21, name: 'George', gender: 'm', age: 31, bio: 'A reliable presence in the commune; does small clean-ups before they become problems; cannot do loud nights twice in a row; also works in bursts, not routines; but orders in before considering the fridge.', stats: { sharingTolerance: 11, cookingSkill: 4, tidiness: 16, handiness: 12, consideration: 12, sociability: 9, partyStamina: 5, workEthic: 7 } },
  { id: 22, name: 'Georgia', gender: 'f', age: 37, bio: 'Brings a distinct energy to the house; keeps the group chat alive; has a second wind at midnight; also procrastinates until it\'s urgent; but leaves a trail of mugs and laundry.', stats: { sharingTolerance: 10, cookingSkill: 10, tidiness: 6, handiness: 11, consideration: 11, sociability: 16, partyStamina: 17, workEthic: 7 } },
  { id: 23, name: 'Hailey', gender: 'f', age: 37, bio: "Easy to live with on a good day; always knows what everyone is up to; treats weeknights like weekends; also procrastinates until it's urgent; but can't see mess until it's catastrophic.", stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 6, handiness: 10, consideration: 12, sociability: 17, partyStamina: 16, workEthic: 7 } },
  { id: 24, name: 'Harri', gender: 'm', age: 31, bio: 'A bit of an acquired taste, but useful; fixes what breaks before anyone notices; needs clear boundaries around sharing; also cannot do loud nights twice in a row.', stats: { sharingTolerance: 4, cookingSkill: 11, tidiness: 12, handiness: 16, consideration: 12, sociability: 11, partyStamina: 6, workEthic: 12 } },
  { id: 25, name: 'Henry', gender: 'm', age: 33, bio: 'Low drama by default; keeps surfaces clear and systems tidy; orders in before considering the fridge; also finishes what they start.', stats: { sharingTolerance: 12, cookingSkill: 6, tidiness: 17, handiness: 11, consideration: 10, sociability: 9, partyStamina: 12, workEthic: 16 } },
  { id: 26, name: 'Holly', gender: 'f', age: 28, bio: 'Friendly in their own way; shares without keeping score; is allergic to all-nighters; also does small clean-ups before they become problems.', stats: { sharingTolerance: 17, cookingSkill: 11, tidiness: 16, handiness: 11, consideration: 10, sociability: 10, partyStamina: 4, workEthic: 12 } },
  { id: 27, name: 'Irene', gender: 'f', age: 27, bio: 'A reliable presence in the commune; remembers everyone\'s preferences; is allergic to all-nighters; also turns broken things into weekend projects.', stats: { sharingTolerance: 11, cookingSkill: 11, tidiness: 10, handiness: 16, consideration: 16, sociability: 10, partyStamina: 6, workEthic: 12 } },
  { id: 28, name: 'Izzy', gender: 'f', age: 29, bio: 'Brings a distinct energy to the house; keeps the group chat alive; has a second wind at midnight; also labels their food and means it.', stats: { sharingTolerance: 4, cookingSkill: 10, tidiness: 11, handiness: 12, consideration: 12, sociability: 17, partyStamina: 16, workEthic: 12 } },
  { id: 29, name: 'Jack', gender: 'm', age: 38, bio: 'Easy to live with on a good day; finishes what they start; labels their food and means it; also cannot relax in a messy kitchen.', stats: { sharingTolerance: 4, cookingSkill: 12, tidiness: 16, handiness: 11, consideration: 10, sociability: 10, partyStamina: 12, workEthic: 17 } },
  { id: 30, name: 'Jade', gender: 'f', age: 31, bio: 'A reliable presence in the commune; happy to share gear and leftovers; is allergic to all-nighters; also finishes what they start.', stats: { sharingTolerance: 16, cookingSkill: 11, tidiness: 12, handiness: 10, consideration: 11, sociability: 11, partyStamina: 4, workEthic: 16 } },
  { id: 31, name: 'Jake', gender: 'm', age: 31, bio: 'Mostly chill, until something crosses a line; fixes what breaks before anyone notices; cannot do loud nights twice in a row; also turns plans into checklists and outcomes.', stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 10, handiness: 17, consideration: 11, sociability: 9, partyStamina: 5, workEthic: 16 } },
  { id: 32, name: 'James', gender: 'm', age: 30, bio: 'Friendly in their own way; turns plans into checklists and outcomes; survives on toast-level meals; also keeps surfaces clear and systems tidy.', stats: { sharingTolerance: 11, cookingSkill: 4, tidiness: 16, handiness: 12, consideration: 11, sociability: 10, partyStamina: 12, workEthic: 17 } },
  { id: 33, name: 'Jelena', gender: 'f', age: 32, bio: 'Low drama by default; shows up consistently, even for boring jobs; is allergic to all-nighters; also owns no tools and wants it that way.', stats: { sharingTolerance: 12, cookingSkill: 9, tidiness: 11, handiness: 4, consideration: 12, sociability: 12, partyStamina: 6, workEthic: 17 } },
  { id: 34, name: 'Josh', gender: 'm', age: 34, bio: 'A reliable presence in the commune; fixes what breaks before anyone notices; is allergic to all-nighters; also keeps chats short and sweet.', stats: { sharingTolerance: 12, cookingSkill: 10, tidiness: 10, handiness: 16, consideration: 11, sociability: 6, partyStamina: 5, workEthic: 12 } },
  { id: 35, name: 'Julia', gender: 'f', age: 36, bio: 'Mostly chill, until something crosses a line; remembers everyone\'s preferences; is allergic to all-nighters; also owns no tools and wants it that way.', stats: { sharingTolerance: 12, cookingSkill: 12, tidiness: 11, handiness: 4, consideration: 16, sociability: 11, partyStamina: 6, workEthic: 11 } },
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
  { id: 66, name: 'Sophie', gender: 'f', age: 31, bio: 'Mostly chill, until something crosses a line; remembers everyone\'s preferences; is allergic to all-nighters; also calls someone else when things break.', stats: { sharingTolerance: 10, cookingSkill: 11, tidiness: 10, handiness: 4, consideration: 16, sociability: 12, partyStamina: 6, workEthic: 12 } },
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

function statToPercentage(stat) {
  return (stat - 10) * 10;
}

let llamaPool = [];

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
    quality: 1, funMult: 1.3, noiseMult: 1.0, driveMult: 1.2,
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
  brackets: [6, 12, 20, 50, 100],
  outputMults: [1.0, 1.15, 1.3, 1.5, 1.75, 2.0],
  healthMults: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7],
  qualityCaps: [2, 3, 4, 5, 5, 5]
};

const DEFAULT_POLICY_CONFIG = {
  excludePercent: 0.25,
  funPenalty: { threshold: 3, K: 0.15, P: 1.5 }
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
  chores_rota: { cost: 500 },
  cleaner: { cost: 1000, weeklyCost: 150, effectPercent: 20 },
  ocado: { cost: 1000, effectPercent: 15 },
  wellness: { cost: 1000 },
  great_hall: { cost: 1000, capacityBoost: 10, funMultBoost: 0.3, driveMultBoost: 0.2 },
  starlink: { cost: 500, weeklyCost: 100, effectPercent: 15 },
  blanket_fort: { cost: 500 },
  always_be_escalating: { cost: 1000 },
  outdoor_plumbing: { cost: 1000 },
  laundry_room: { cost: 2000 },
  ukrainian_cleaner: { cost: 2000 },
  competitive_cooking: { cost: 2000 },
  majestic_guvnor: { cost: 2000 },
  group_yoga: { cost: 2000 },
  sauna: { cost: 2000 },
  call_rooms: { cost: 2000 },
  adderall: { cost: 2000, weeklyCost: 200, effectPercent: 25 },
  party_planning: { cost: 2000 },
  psychedelics: { cost: 2000, weeklyCost: 200, effectPercent: 20 },
  polyamory: { cost: 2000 },
  advanced_blanket_fort: { cost: 2000 }
};

const DEFAULT_PRIMITIVE_CONFIG = {
  penaltyK: 2,
  penaltyP: 2,
  crowding: { weight: 1.0, useCustomPenalty: false, penaltyK: 2, penaltyP: 2 },
  noise: { baseSocial: 5, baseAmbient: 10, socioMult: 0.1, considMult: 0.3, useCustomPenalty: false, penaltyK: 2, penaltyP: 2 },
  nutrition: { outputRate: 5, consumptionRate: 9, skillMult: 0.1, useCustomPenalty: false, penaltyK: 2, penaltyP: 2 },
  cleanliness: { outputRate: 2, consumptionRate: 4, skillMult: 0.1, useCustomPenalty: false, penaltyK: 2, penaltyP: 2 },
  maintenance: { wearPerResident: 1, repairBase: 3, recoveryRate: 0.1, useCustomPenalty: false, penaltyK: 2, penaltyP: 2 },
  fatigue: { exertBase: 3, recoverBase: 5, workMult: 0.3, socioMult: 0.2 },
  fun: { outputRate: 6, consumptionRate: 12, skillMult: 0.1, useCustomPenalty: false, penaltyK: 2, penaltyP: 2 },
  drive: { outputRate: 4, slackRate: 8, skillMult: 0.1, useCustomPenalty: false, penaltyK: 2, penaltyP: 2 }
};

const DEFAULT_HEALTH_CONFIG = {
  livingStandards: {
    nutritionWeight: 0.5,
    cleanlinessWeight: 0.5,
    crowdingDampen: 0.35,
    maintenanceDampen: 0.35,
    rentCurve: 0.7,
    useCustomScaling: false,
    ref0: 0.3,
    alpha: 0.15,
    p: 2,
    tierMult: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7]
  },
  productivity: {
    driveWeight: 1.0,
    fatigueWeight: 0.55,
    noiseWeight: 0.35,
    crowdingWeight: 0.25,
    useCustomScaling: false,
    ref0: 0.3,
    alpha: 0.15,
    p: 2,
    tierMult: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7]
  },
  partytime: {
    funWeight: 1.0,
    fatigueWeight: 0.45,
    noiseBoostScale: 0.08,
    useCustomScaling: false,
    ref0: 0.3,
    alpha: 0.15,
    p: 2,
    tierMult: [1.0, 1.1, 1.2, 1.35, 1.5, 1.7]
  },
  globalScaling: {
    ref0: 0.3,
    alpha: 0.15,
    p: 2
  },
  pop0: 2,
  tierBrackets: [6, 12, 20, 50, 100],
  churnBaselinePR: 35,
  churnScalePerPoint: 0.01,
  recruitBaselinePT: 35,
  recruitScalePerSlot: 15,
  baseRecruitSlots: 1
};

const DEFAULT_VIBES_CONFIG = {
  balancedThreshold: 0.18,
  strongImbalanceThreshold: 0.30,
  tierThresholds: [
    { name: 'Shambles', min: 0, max: 0.15 },
    { name: 'Rough', min: 0.15, max: 0.25 },
    { name: 'Scrappy', min: 0.25, max: 0.35 },
    { name: 'Fine', min: 0.35, max: 0.45 },
    { name: 'Good', min: 0.45, max: 0.55 },
    { name: 'Lovely', min: 0.55, max: 0.65 },
    { name: 'Thriving', min: 0.65, max: 0.75 },
    { name: 'Wonderful', min: 0.75, max: 0.85 },
    { name: 'Glorious', min: 0.85, max: 0.95 },
    { name: 'Utopia', min: 0.95, max: 1.01 }
  ],
  scaleBreakpoints: [
    { min: 1, max: 5, tierMin: 3, tierMax: 5 },
    { min: 6, max: 10, tierMin: 3, tierMax: 6 },
    { min: 11, max: 20, tierMin: 2, tierMax: 7 },
    { min: 21, max: 35, tierMin: 1, tierMax: 8 },
    { min: 36, max: 999, tierMin: 0, tierMax: 9 }
  ],
  branchLabels: {
    highPartytime: { mild: 'Party House', strong: 'Party Mansion' },
    highProductivity: { mild: 'Grind House', strong: 'Sweat Shop' },
    highLivingStandards: { mild: 'Showhome', strong: 'Dolls House' },
    lowLivingStandards: { mild: 'Shanty Town', strong: 'Slum' },
    lowProductivity: { mild: 'Decadent', strong: 'Chaotic' },
    lowPartytime: { mild: 'Low Energy', strong: 'Dead' }
  }
};

const DEFAULT_BUDGET_CONFIG = {
  nutrition: { key: 'nutrition', label: 'Ingredients', type: 'coverage', efficiency: 0.5, investment: 0 },
  cleanliness: { key: 'cleanliness', label: 'Cleaning materials', type: 'coverage', efficiency: 0.5, investment: 0 },
  maintenance: { key: 'maintenance', label: 'Handiman', type: 'stock', reductionRate: 0.02, investment: 0 },
  fatigue: { key: 'fatigue', label: 'Wellness', type: 'stock', reductionRate: 0.02, investment: 0 },
  fun: { key: 'fun', label: 'Party supplies', type: 'coverage', efficiency: 0.5, investment: 0 },
  drive: { key: 'drive', label: 'Internet', type: 'coverage', efficiency: 0.5, investment: 0 }
};

const INITIAL_DEFAULTS = {
  startingTreasury: 0,
  startingResidents: 10,
  buildsPerWeek: 1,
  policyChangesPerWeek: 1,
  researchActionsPerWeek: 1,
  rentMin: 50,
  rentMax: 500,
  defaultRent: 100,
  groundRentBase: 1000,
  utilitiesBase: 200,
  baseChurnRate: 0.20,
  churnRentMultiplier: 0.0003,
  gameOverLimit: -20000,
  tickSpeed: 200,
  hoursPerTick: 4,
  rentTierThresholds: [
    { name: 'Bargain', maxChurn: 0.02 },
    { name: 'Cheap', maxChurn: 0.05 },
    { name: 'Fair', maxChurn: 0.08 },
    { name: 'Pricey', maxChurn: 0.12 },
    { name: 'Extortionate', maxChurn: 1.0 }
  ],
  startingBudgets: {
    nutrition: 0,
    cleanliness: 0,
    maintenance: 0,
    fatigue: 0,
    fun: 0,
    drive: 0
  },
  primitives: { ...DEFAULT_PRIMITIVE_CONFIG },
  health: { ...DEFAULT_HEALTH_CONFIG },
  vibes: { ...DEFAULT_VIBES_CONFIG },
  tierConfig: { ...DEFAULT_TIER_CONFIG }
};

function loadSavedDefaults() {
  try {
    if (fs.existsSync(SAVED_DEFAULTS_FILE)) {
      console.log('Loading saved defaults from file:', SAVED_DEFAULTS_FILE);
      const data = JSON.parse(fs.readFileSync(SAVED_DEFAULTS_FILE, 'utf8'));
      console.log('Loaded defaults - tickSpeed:', data.defaults?.tickSpeed, 'startingResidents:', data.defaults?.startingResidents);
      return {
        defaults: data.defaults || { ...INITIAL_DEFAULTS },
        llamaPool: data.llamaPool || null,
        buildings: data.buildings || null
      };
    } else {
      console.log('No saved defaults file found, using INITIAL_DEFAULTS');
    }
  } catch (err) {
    console.error('Failed to load saved defaults:', err);
  }
  return { defaults: { ...INITIAL_DEFAULTS }, llamaPool: null, buildings: null };
}

const loadedData = loadSavedDefaults();
let savedDefaults = loadedData.defaults;
let primitiveConfig = savedDefaults.primitives ? { ...savedDefaults.primitives } : { ...DEFAULT_PRIMITIVE_CONFIG };
let healthConfig = savedDefaults.health ? { ...savedDefaults.health } : { ...DEFAULT_HEALTH_CONFIG };
let vibesConfig = savedDefaults.vibes ? { ...savedDefaults.vibes } : { ...DEFAULT_VIBES_CONFIG };
let tierConfig = savedDefaults.tierConfig ? { ...savedDefaults.tierConfig } : { ...DEFAULT_TIER_CONFIG };
let savedLlamaPool = loadedData.llamaPool;
let savedBuildingsConfig = loadedData.buildings;
let budgetConfig = savedDefaults.budgetConfig ? JSON.parse(JSON.stringify(savedDefaults.budgetConfig)) : JSON.parse(JSON.stringify(DEFAULT_BUDGET_CONFIG));
let policyConfig = savedDefaults.policyConfig ? JSON.parse(JSON.stringify(savedDefaults.policyConfig)) : JSON.parse(JSON.stringify(DEFAULT_POLICY_CONFIG));
let techConfig = savedDefaults.techConfig ? JSON.parse(JSON.stringify(savedDefaults.techConfig)) : JSON.parse(JSON.stringify(DEFAULT_TECH_CONFIG));

function deepMergePrimitives(defaults, overrides) {
  const result = { ...defaults };
  if (!overrides) return result;
  for (const key of Object.keys(defaults)) {
    if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
      result[key] = { ...defaults[key], ...(overrides[key] || {}) };
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  }
  for (const key of Object.keys(overrides)) {
    if (!(key in defaults)) {
      result[key] = overrides[key];
    }
  }
  return result;
}

function initializeGame(config = savedDefaults) {
  gameConfig = { ...INITIAL_DEFAULTS, ...config };
  primitiveConfig = deepMergePrimitives(DEFAULT_PRIMITIVE_CONFIG, config.primitives);
  healthConfig = deepMergePrimitives(DEFAULT_HEALTH_CONFIG, config.health);
  vibesConfig = config.vibes ? { ...config.vibes } : { ...DEFAULT_VIBES_CONFIG };
  tierConfig = config.tierConfig ? { ...config.tierConfig } : { ...DEFAULT_TIER_CONFIG };
  if (config.budgetConfig) {
    budgetConfig = JSON.parse(JSON.stringify(config.budgetConfig));
  }
  if (config.policyConfig) {
    policyConfig = JSON.parse(JSON.stringify(config.policyConfig));
  }
  if (config.techConfig) {
    techConfig = JSON.parse(JSON.stringify(config.techConfig));
  }
  
  llamaPool = savedLlamaPool 
    ? JSON.parse(JSON.stringify(savedLlamaPool)) 
    : JSON.parse(JSON.stringify(STARTING_LLAMAS));
  
  let buildingsConfig;
  if (savedBuildingsConfig) {
    buildingsConfig = JSON.parse(JSON.stringify(savedBuildingsConfig));
    DEFAULT_BUILDINGS.forEach(def => {
      if (!buildingsConfig.find(b => b.id === def.id)) {
        buildingsConfig.push(JSON.parse(JSON.stringify(def)));
      }
    });
  } else {
    buildingsConfig = JSON.parse(JSON.stringify(DEFAULT_BUILDINGS));
  }
  
  const shuffled = [...llamaPool].sort(() => Math.random() - 0.5);
  const startingResidentObjects = shuffled.slice(0, gameConfig.startingResidents).map(llama => ({
    ...llama,
    daysThisWeek: 7,
    arrivalDay: null
  }));
  
  const buildings = buildingsConfig.map(b => ({
    ...b,
    count: b.atStart
  }));
  
  gameState = {
    treasury: gameConfig.startingTreasury,
    buildings: buildings,
    communeResidents: startingResidentObjects,
    pendingArrivals: [],
    currentRent: gameConfig.defaultRent,
    week: 1,
    day: 1,
    hour: 9,
    dayName: 'Monday',
    isRunning: false,
    isPausedForWeeklyDecision: true,
    isGameOver: false,
    lastWeekSummary: null,
    hasRecruitedThisWeek: false,
    buildsThisWeek: 0,
    weekCandidates: [],
    weeklyDelta: 0,
    dailyDelta: 0,
    treasuryAtWeekStart: gameConfig.startingTreasury,
    primitives: {
      crowding: 0,
      noise: 0,
      nutrition: 50,
      cleanliness: 50,
      maintenance: 0,
      fatigue: 0,
      fun: 50,
      drive: 50
    },
    healthMetrics: {
      livingStandards: 0.5,
      productivity: 0.5,
      partytime: 0.5
    },
    metricHistory: [],
    vibes: {
      overallLevel: 0.5,
      spread: 0,
      tierName: 'Decent',
      branchLabel: null,
      isBalanced: true,
      scaleTier: 1
    },
    coverageData: {
      tier: 0,
      tierOutputMult: 1.0,
      nutrition: { supply: 0, demand: 0, ratio: 1, label: 'Adequate' },
      cleanliness: { supply: 0, demand: 0, ratio: 1, label: 'Adequate' },
      fun: { supply: 0, demand: 0, ratio: 1, label: 'Adequate' },
      drive: { supply: 0, demand: 0, ratio: 1, label: 'Adequate' }
    },
    budgets: {
      nutrition: gameConfig.startingBudgets?.nutrition || 0,
      cleanliness: gameConfig.startingBudgets?.cleanliness || 0,
      maintenance: gameConfig.startingBudgets?.maintenance || 0,
      fatigue: gameConfig.startingBudgets?.fatigue || 0,
      fun: gameConfig.startingBudgets?.fun || 0,
      drive: gameConfig.startingBudgets?.drive || 0
    },
    activePolicies: [],
    researchedTechs: [],
    activeFixedCosts: [],
    hasResearchedThisWeek: false,
    researchingTech: null,
    policyChangesThisWeek: 0,
    policiesStableWeeks: 0,
    previousPolicies: []
  };
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  gameState.metricHistory.push({
    week: gameState.week,
    day: gameState.day,
    ls: Math.round((gameState.healthMetrics.livingStandards || 0) * 100),
    pr: Math.round((gameState.healthMetrics.productivity || 0) * 100),
    pt: Math.round((gameState.healthMetrics.partytime || 0) * 100)
  });
  calculateWeeklyProjection();
  generateWeekCandidates();
}

function generateWeekCandidates() {
  const available = getAvailableLlamas();
  const shuffled = available.sort(() => Math.random() - 0.5);
  gameState.weekCandidates = shuffled.slice(0, Math.min(3, shuffled.length));
}

function calculateWeeklyProjection() {
  const residentCount = gameState.communeResidents.length;
  const income = residentCount * gameState.currentRent;
  const groundRent = calculateGroundRent();
  const utilities = calculateUtilities();
  const totalBudget = Object.values(gameState.budgets).reduce((sum, v) => sum + v, 0);
  let totalFixedCosts = 0;
  (gameState.activeFixedCosts || []).forEach(fcId => {
    const cfg = techConfig[fcId];
    if (cfg && cfg.weeklyCost) {
      totalFixedCosts += cfg.weeklyCost;
    }
  });
  const weeklyDelta = income - groundRent - utilities - totalBudget - totalFixedCosts;
  gameState.weeklyDelta = weeklyDelta;
  gameState.dailyDelta = weeklyDelta / 7;
  gameState.projectedIncome = income;
  gameState.projectedGroundRent = groundRent;
  gameState.projectedUtilities = utilities;
  gameState.projectedBudget = totalBudget;
  gameState.projectedFixedCosts = totalFixedCosts;
}

function calculateTotalCapacity() {
  const bedroomBuilding = gameState.buildings.find(b => b.id === 'bedroom');
  return bedroomBuilding ? bedroomBuilding.count * bedroomBuilding.capacity : 0;
}

function calculateGroundRent() {
  let multiplier = 0;
  gameState.buildings.forEach(b => {
    if (b.groundRentMultiplier !== null) {
      const extraCount = Math.max(0, b.count - b.atStart);
      multiplier += extraCount * b.groundRentMultiplier;
    }
  });
  return Math.round(gameConfig.groundRentBase * (1 + multiplier));
}

function calculateUtilities() {
  let multiplier = 0;
  gameState.buildings.forEach(b => {
    if (b.utilitiesMultiplier !== null) {
      const extraCount = Math.max(0, b.count - b.atStart);
      multiplier += extraCount * b.utilitiesMultiplier;
    }
  });
  return Math.round(gameConfig.utilitiesBase * (1 + multiplier));
}

function calculateWeeklyChurnCount() {
  const pr = gameState.healthMetrics.productivity * 100;
  const baseline = healthConfig.churnBaselinePR || 35;
  const scale = healthConfig.churnScalePerPoint || 0.01;
  
  const rentFactor = gameState.currentRent * gameConfig.churnRentMultiplier;
  // PR above baseline reduces churn, below baseline increases it
  const prModifier = (baseline - pr) * scale;
  const totalChurnRate = Math.min(1, Math.max(0, gameConfig.baseChurnRate + rentFactor + prModifier));
  
  const activeResidents = gameState.communeResidents.filter(r => !r.churned);
  const residentCount = activeResidents.length;
  const residentsLeaving = Math.floor(residentCount * totalChurnRate);
  return Math.min(residentsLeaving, residentCount);
}

function getAverageResidentStat(statKey) {
  const residents = gameState.communeResidents.filter(r => !r.churned);
  if (residents.length === 0) return 10;
  const sum = residents.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
  return sum / residents.length;
}

function statTo01(stat) {
  return Math.max(0, Math.min(1, (stat - 1) / 19));
}

function getPolicyAdjustedAvgStat(statKey) {
  const residents = gameState.communeResidents.filter(r => !r.churned);
  if (residents.length === 0) return 10;
  const policy = POLICY_DEFINITIONS.find(p => p.stat === statKey && gameState.activePolicies.includes(p.id));
  if (!policy) {
    const sum = residents.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
    return sum / residents.length;
  }
  const excludePct = policyConfig.excludePercent || 0.25;
  const sorted = [...residents].sort((a, b) => (a.stats[statKey] || 10) - (b.stats[statKey] || 10));
  const excludeCount = Math.floor(sorted.length * excludePct);
  if (excludeCount <= 0 || sorted.length <= excludeCount) {
    const sum = residents.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
    return sum / residents.length;
  }
  const included = sorted.slice(excludeCount);
  const sum = included.reduce((acc, r) => acc + (r.stats[statKey] || 10), 0);
  return sum / included.length;
}

function getBuildingCapacity(buildingId) {
  const b = gameState.buildings.find(bld => bld.id === buildingId);
  return b ? b.count * b.capacity : 1;
}

function getBuildingQuality(buildingId) {
  const b = gameState.buildings.find(bld => bld.id === buildingId);
  return b ? (b.quality || 1) : 1;
}

function getBuildingMult(buildingId, multKey) {
  const b = gameState.buildings.find(bld => bld.id === buildingId);
  return b && b[multKey] !== undefined ? b[multKey] : 1;
}

function overcrowdingPenalty(ratio, primitiveName = null) {
  let k = primitiveConfig.penaltyK;
  let p = primitiveConfig.penaltyP;
  if (primitiveName && primitiveConfig[primitiveName]?.useCustomPenalty) {
    k = primitiveConfig[primitiveName].penaltyK ?? k;
    p = primitiveConfig[primitiveName].penaltyP ?? p;
  }
  const over = Math.max(0, ratio - 1);
  return 1 + k * Math.pow(over, p);
}

function getPopulationTier(pop) {
  const brackets = tierConfig.brackets || [6, 12, 20, 50, 100];
  for (let i = 0; i < brackets.length; i++) {
    if (pop <= brackets[i]) return i;
  }
  return brackets.length;
}

function getTierOutputMult(tier) {
  const mults = tierConfig.outputMults || [1.0, 1.15, 1.3, 1.5, 1.75, 2.0];
  return mults[Math.min(tier, mults.length - 1)];
}

function getTierHealthMult(tier) {
  const mults = tierConfig.healthMults || [1.0, 1.1, 1.2, 1.35, 1.5, 1.7];
  return mults[Math.min(tier, mults.length - 1)];
}

function log2CoverageScore(ratio) {
  if (ratio <= 0) return 0;
  const log2Ratio = Math.log2(ratio);
  const score = 25 * (log2Ratio + 2);
  return Math.max(0, Math.min(100, score));
}

function getCoverageTierLabel(score) {
  if (score < 25) return 'Shortfall';
  if (score < 45) return 'Tight';
  if (score < 60) return 'Adequate';
  if (score < 75) return 'Good';
  if (score < 90) return 'Great';
  return 'Superb';
}

function calculatePrimitives() {
  const N = gameState.communeResidents.length;
  if (N === 0) {
    gameState.primitives = { crowding: 0, noise: 0, nutrition: 50, cleanliness: 50, maintenance: 0, fatigue: 0, fun: 50, drive: 50 };
    return;
  }
  
  const ticksPerDay = 24 / gameConfig.hoursPerTick;
  const ticksPerWeek = ticksPerDay * 7;
  
  const capBed = getBuildingCapacity('bedroom');
  const capBath = getBuildingCapacity('bathroom');
  const capKitch = getBuildingCapacity('kitchen');
  const capLiv = getBuildingCapacity('living_room');
  const capUtil = getBuildingCapacity('utility_closet');
  
  let effectiveCapLiv = capLiv;
  let greatHallFunMult = 1;
  let greatHallDriveMult = 1;
  if (gameState.researchedTechs.includes('great_hall')) {
    const ghBuilding = gameState.buildings.find(b => b.id === 'great_hall');
    if (ghBuilding) {
      effectiveCapLiv = capLiv + (ghBuilding.capacity != null ? ghBuilding.capacity : 10);
      greatHallFunMult = ghBuilding.funMult != null ? ghBuilding.funMult : 1.3;
      greatHallDriveMult = ghBuilding.driveMult != null ? ghBuilding.driveMult : 1.2;
    }
  }
  
  const shareTol = statTo01(getAverageResidentStat('sharingTolerance'));
  const cookSkill = statTo01(getPolicyAdjustedAvgStat('cookingSkill'));
  const tidiness = statTo01(getPolicyAdjustedAvgStat('tidiness'));
  const handiness = statTo01(getAverageResidentStat('handiness'));
  const consideration = statTo01(getAverageResidentStat('consideration'));
  const sociability = statTo01(getAverageResidentStat('sociability'));
  const partyStamina = statTo01(getAverageResidentStat('partyStamina'));
  const workEthic = statTo01(getAverageResidentStat('workEthic'));
  
  const kQ = getBuildingQuality('kitchen');
  const lQ = getBuildingQuality('living_room');
  const bQ = getBuildingQuality('bedroom');
  const bathQ = getBuildingQuality('bathroom');
  const uQ = getBuildingQuality('utility_closet');
  
  const effectiveN = N * (1 - 0.3 * shareTol);
  const rBed = effectiveN / capBed;
  const rBath = effectiveN / capBath;
  const rKitch = effectiveN / capKitch;
  const rLiv = effectiveN / effectiveCapLiv;
  const maxRatio = Math.max(rBed, rBath, rKitch, rLiv);
  const crowding = Math.min(100, maxRatio * 50 * overcrowdingPenalty(maxRatio, 'crowding'));
  
  const cfg = primitiveConfig.noise;
  const socialNoise = N * cfg.baseSocial * (1 + cfg.socioMult * sociability) * (1 - cfg.considMult * consideration);
  const ambientNoise = cfg.baseAmbient * overcrowdingPenalty(N / effectiveCapLiv, 'noise');
  const noise = Math.min(100, (socialNoise + ambientNoise) * (1 / lQ));
  
  const tier = getPopulationTier(N);
  const tierOutputMult = getTierOutputMult(tier);
  
  const nCfg = primitiveConfig.nutrition;
  const nutritionServed = Math.min(N, capKitch);
  const nutritionSupply = nutritionServed * nCfg.outputRate * tierOutputMult * kQ * getBuildingMult('kitchen', 'foodMult') * (1 + nCfg.skillMult * cookSkill);
  let nutritionEfficiency = budgetConfig.nutrition.efficiency || 0;
  if (gameState.activePolicies.includes('ocado')) {
    const ocadoBoost = (techConfig.ocado?.effectPercent || 15) / 100;
    nutritionEfficiency *= (1 + ocadoBoost);
  }
  const nutritionBudgetBoost = (gameState.budgets.nutrition || 0) * nutritionEfficiency;
  const totalNutritionSupply = nutritionSupply + nutritionBudgetBoost;
  const nutritionDemand = N * nCfg.consumptionRate;
  const nutritionRatio = nutritionDemand > 0 ? totalNutritionSupply / nutritionDemand : 1;
  const nutrition = log2CoverageScore(nutritionRatio);
  
  const cCfg = primitiveConfig.cleanliness;
  const cleanServed = Math.min(N, capBath);
  const cleanSupply = cleanServed * cCfg.outputRate * tierOutputMult * bathQ * getBuildingMult('bathroom', 'cleanMult') * (1 + cCfg.skillMult * tidiness);
  const cleanBudgetBoost = (gameState.budgets.cleanliness || 0) * (budgetConfig.cleanliness.efficiency || 0);
  let totalCleanSupply = cleanSupply + cleanBudgetBoost;
  if (gameState.activeFixedCosts.includes('cleaner')) {
    const cleanerBoost = (techConfig.cleaner?.effectPercent || 20) / 100;
    totalCleanSupply *= (1 + cleanerBoost);
  }
  const cleanDemand = N * cCfg.consumptionRate;
  const cleanRatio = cleanDemand > 0 ? totalCleanSupply / cleanDemand : 1;
  const cleanliness = log2CoverageScore(cleanRatio);
  
  const mCfg = primitiveConfig.maintenance;
  const wearIn = mCfg.wearPerResident * N * overcrowdingPenalty(N / capUtil, 'maintenance');
  const repairOut = mCfg.repairBase * uQ * getBuildingMult('utility_closet', 'repairMult') * (1 + 0.5 * handiness + 0.2 * tidiness);
  const netWear = wearIn - repairOut;
  const oldMaint = gameState.primitives.maintenance || 0;
  const maintenance = Math.min(100, Math.max(0, oldMaint + netWear * 0.5 - (gameState.budgets.maintenance || 0) * (budgetConfig.maintenance.reductionRate || 0) / ticksPerWeek));
  
  const fCfg = primitiveConfig.fatigue;
  const exertion = N * fCfg.exertBase * (1 + fCfg.workMult * workEthic + fCfg.socioMult * sociability);
  const recovery = N * fCfg.recoverBase * bQ * getBuildingMult('bedroom', 'recoveryMult') * (1 + 0.3 * partyStamina);
  const netFatigue = (exertion - recovery) / N;
  const oldFatigue = gameState.primitives.fatigue || 0;
  const fatigue = Math.min(100, Math.max(0, oldFatigue + netFatigue * 0.3 - (gameState.budgets.fatigue || 0) * (budgetConfig.fatigue.reductionRate || 0) / ticksPerWeek));
  
  const funCfg = primitiveConfig.fun;
  const funServed = Math.min(N, effectiveCapLiv);
  const funSupply = funServed * funCfg.outputRate * tierOutputMult * lQ * getBuildingMult('living_room', 'funMult') * (1 + funCfg.skillMult * (sociability + partyStamina) / 2) * greatHallFunMult;
  const funBudgetBoost = (gameState.budgets.fun || 0) * (budgetConfig.fun.efficiency || 0);
  const totalFunSupply = funSupply + funBudgetBoost;
  let extraFunOutput = 0;
  const heavenBuilding = gameState.buildings.find(b => b.id === 'heaven');
  if (heavenBuilding && heavenBuilding.count > 0) {
    extraFunOutput += heavenBuilding.count * (heavenBuilding.funOutput || 3) * tierOutputMult;
  }
  const hotTubBuilding = gameState.buildings.find(b => b.id === 'hot_tub');
  if (hotTubBuilding && hotTubBuilding.count > 0) {
    extraFunOutput += hotTubBuilding.count * (hotTubBuilding.funOutput || 2) * tierOutputMult;
  }
  const totalFunWithBuildings = totalFunSupply + extraFunOutput;
  const funDemand = N * funCfg.consumptionRate;
  const activePolicyCount = (gameState.activePolicies || []).length;
  const policyThreshold = policyConfig.funPenalty?.threshold || 3;
  const policyK = policyConfig.funPenalty?.K || 0.15;
  const policyP = policyConfig.funPenalty?.P || 1.5;
  let policyFunMult = 1;
  if (activePolicyCount > policyThreshold) {
    const excess = activePolicyCount - policyThreshold;
    policyFunMult = 1 / (1 + policyK * Math.pow(excess, policyP));
  }
  const adjustedFunSupply = totalFunWithBuildings * policyFunMult;
  const funRatio = funDemand > 0 ? adjustedFunSupply / funDemand : 1;
  const fun = log2CoverageScore(funRatio);
  
  const dCfg = primitiveConfig.drive;
  const driveServed = Math.min(N, effectiveCapLiv);
  const driveSupply = driveServed * dCfg.outputRate * tierOutputMult * lQ * (1 + dCfg.skillMult * workEthic) * greatHallDriveMult;
  const driveBudgetBoost = (gameState.budgets.drive || 0) * (budgetConfig.drive.efficiency || 0);
  let totalDriveSupply = driveSupply + driveBudgetBoost;
  if (gameState.activeFixedCosts.includes('starlink')) {
    const starlinkBoost = (techConfig.starlink?.effectPercent || 15) / 100;
    totalDriveSupply *= (1 + starlinkBoost);
  }
  const driveDemand = N * dCfg.slackRate;
  const driveRatio = driveDemand > 0 ? totalDriveSupply / driveDemand : 1;
  const drive = log2CoverageScore(driveRatio);
  
  gameState.primitives = { crowding, noise, nutrition, cleanliness, maintenance, fatigue, fun, drive };
  
  gameState.coverageData = {
    tier,
    tierOutputMult,
    nutrition: { supply: totalNutritionSupply, demand: nutritionDemand, ratio: nutritionRatio, label: getCoverageTierLabel(nutrition), budgetBoost: nutritionBudgetBoost },
    cleanliness: { supply: totalCleanSupply, demand: cleanDemand, ratio: cleanRatio, label: getCoverageTierLabel(cleanliness), budgetBoost: cleanBudgetBoost },
    fun: { supply: totalFunWithBuildings, demand: funDemand, ratio: funRatio, label: getCoverageTierLabel(fun), budgetBoost: funBudgetBoost },
    drive: { supply: totalDriveSupply, demand: driveDemand, ratio: driveRatio, label: getCoverageTierLabel(drive), budgetBoost: driveBudgetBoost }
  };
}

function dampener(value, weight) {
  const norm = value / 100;
  return Math.pow(1 - norm, weight);
}

function baseline(value, weight) {
  const norm = value / 100;
  return Math.pow(norm, weight);
}

function getTierFromPop(pop) {
  const brackets = healthConfig.tierBrackets || [6, 12, 20, 50, 100];
  for (let i = 0; i < brackets.length; i++) {
    if (pop <= brackets[i]) return i;
  }
  return brackets.length;
}

function calculateMetricScore(rawValue, metricConfig, pop) {
  const pop0 = Math.max(1, healthConfig.pop0 || 2);
  const globalScaling = healthConfig.globalScaling || { ref0: 0.5, alpha: 0.15, p: 2 };
  const useCustom = metricConfig.useCustomScaling === true;
  const ref0 = Math.max(0.01, useCustom ? (metricConfig.ref0 || 0.5) : (globalScaling.ref0 || 0.5));
  const alpha = useCustom ? (metricConfig.alpha || 0.15) : (globalScaling.alpha || 0.15);
  const p = Math.max(0.1, useCustom ? (metricConfig.p || 2) : (globalScaling.p || 2));
  const tierMult = metricConfig.tierMult || [1.0, 1.1, 1.2, 1.35, 1.5, 1.7];
  const brackets = healthConfig.tierBrackets || [6, 12, 20, 50, 100];
  
  const tier = getTierFromPop(pop);
  const safeTierIndex = Math.min(tier, tierMult.length - 1, brackets.length);
  const tierMultiplier = tierMult[safeTierIndex] || 1.0;
  
  const mRef = Math.max(0.001, ref0 * Math.pow(pop / pop0, alpha) * tierMultiplier);
  const x = rawValue / mRef;
  
  const xp = Math.pow(x, p);
  const score = 100 * xp / (1 + xp);
  
  return Math.max(0, Math.min(100, score));
}

function calculateHealthMetrics() {
  const p = gameState.primitives;
  const ls = healthConfig.livingStandards;
  const pr = healthConfig.productivity;
  const pt = healthConfig.partytime;
  const pop = gameState.communeResidents.filter(r => !r.churned).length || 1;
  
  const lsRaw = Math.max(0.001,
    baseline(p.nutrition, ls.nutritionWeight) *
    baseline(p.cleanliness, ls.cleanlinessWeight) *
    dampener(p.crowding, ls.crowdingDampen) *
    dampener(p.maintenance, ls.maintenanceDampen)
  );
  
  const prRaw = Math.max(0.001,
    baseline(p.drive, pr.driveWeight) *
    dampener(p.fatigue, pr.fatigueWeight) *
    dampener(p.noise, pr.noiseWeight) *
    dampener(p.crowding, pr.crowdingWeight)
  );
  
  const noiseBonus = Math.max(-0.5, pt.noiseBoostScale * p.noise / 100);
  const ptRaw = Math.max(0.001,
    baseline(p.fun, pt.funWeight) *
    dampener(p.fatigue, pt.fatigueWeight) *
    (1 + noiseBonus)
  );
  
  const livingStandards = calculateMetricScore(lsRaw, ls, pop) / 100;
  const productivity = calculateMetricScore(prRaw, pr, pop) / 100;
  const partytime = calculateMetricScore(ptRaw, pt, pop) / 100;
  
  gameState.healthMetrics = { livingStandards, productivity, partytime };
  gameState.healthMetricsRaw = { livingStandards: lsRaw, productivity: prRaw, partytime: ptRaw };
}

function calculateVibes() {
  const hm = gameState.healthMetrics;
  const N = gameState.communeResidents.length;
  const cfg = vibesConfig;
  
  const ls = hm.livingStandards;
  const pr = hm.productivity;
  const pt = hm.partytime;
  
  const overallLevel = Math.pow(ls * pr * pt, 1/3);
  const sorted = [ls, pr, pt].sort((a, b) => a - b);
  const spread = sorted[2] - sorted[0];
  const median = sorted[1];
  
  const isBalanced = spread <= cfg.balancedThreshold;
  const isStrongImbalance = spread > cfg.strongImbalanceThreshold;
  
  let baseTierIndex = 0;
  for (let i = 0; i < cfg.tierThresholds.length; i++) {
    if (overallLevel >= cfg.tierThresholds[i].min && overallLevel < cfg.tierThresholds[i].max) {
      baseTierIndex = i;
      break;
    }
  }
  if (overallLevel >= cfg.tierThresholds[cfg.tierThresholds.length - 1].min) {
    baseTierIndex = cfg.tierThresholds.length - 1;
  }
  
  let scaleTier = 1;
  for (const s of cfg.scaleBreakpoints) {
    if (N >= s.min && N <= s.max) {
      scaleTier = cfg.scaleBreakpoints.indexOf(s) + 1;
      baseTierIndex = Math.max(s.tierMin, Math.min(s.tierMax, baseTierIndex));
      break;
    }
  }
  
  const tierName = cfg.tierThresholds[baseTierIndex].name;
  
  const vibesScore = overallLevel * 100;
  const popTier = getPopulationTier(N);
  const fameThresholds = [
    { min: 0, max: 20, name: 'Obscure', minTier: 0 },
    { min: 20, max: 40, name: 'Reputable', minTier: 1 },
    { min: 40, max: 60, name: 'Aspirational', minTier: 2 },
    { min: 60, max: 80, name: 'Famous', minTier: 3 },
    { min: 80, max: 101, name: 'Mythical', minTier: 4 }
  ];
  let reputation = 'Obscure';
  for (const f of fameThresholds) {
    if (vibesScore >= f.min && popTier >= f.minTier) {
      reputation = f.name;
    }
  }

  let branchLabel = null;
  if (!isBalanced) {
    const highDelta = sorted[2] - median;
    const lowDelta = median - sorted[0];
    const isHighDriver = highDelta >= lowDelta;
    
    let driverMetric;
    let branchKey;
    if (isHighDriver) {
      if (sorted[2] === pt) { driverMetric = 'Partytime'; branchKey = 'highPartytime'; }
      else if (sorted[2] === pr) { driverMetric = 'Productivity'; branchKey = 'highProductivity'; }
      else { driverMetric = 'LivingStandards'; branchKey = 'highLivingStandards'; }
    } else {
      if (sorted[0] === ls) { driverMetric = 'LivingStandards'; branchKey = 'lowLivingStandards'; }
      else if (sorted[0] === pr) { driverMetric = 'Productivity'; branchKey = 'lowProductivity'; }
      else { driverMetric = 'Partytime'; branchKey = 'lowPartytime'; }
    }
    
    const severity = isStrongImbalance ? 'strong' : 'mild';
    branchLabel = cfg.branchLabels[branchKey]?.[severity] || null;
  }
  
  gameState.vibes = { overallLevel, spread, tierName, branchLabel, isBalanced, scaleTier, reputation };
}

function calculateRecruitmentSlots() {
  const pt = gameState.healthMetrics.partytime * 100;
  const baseline = healthConfig.recruitBaselinePT || 35;
  const scale = healthConfig.recruitScalePerSlot || 15;
  const extraSlots = Math.max(0, Math.floor((pt - baseline) / scale));
  return healthConfig.baseRecruitSlots + extraSlots;
}

function calculateRentTier(rent) {
  const ls = Math.max(0, Math.min(1, gameState.healthMetrics?.livingStandards || 0.5));
  const rentMin = gameConfig.rentMin || 50;
  const rentMax = gameConfig.rentMax || 500;
  const rentCurve = Math.max(0.1, healthConfig.livingStandards?.rentCurve || 2);
  
  const curvedLS = Math.pow(ls, 1 / rentCurve);
  const maxTolerantRent = rentMin + (rentMax - rentMin) * curvedLS;
  
  const tierRatio = rent / maxTolerantRent;
  
  if (tierRatio <= 0.3) return 'Bargain';
  if (tierRatio <= 0.5) return 'Cheap';
  if (tierRatio <= 0.7) return 'Fair';
  if (tierRatio <= 0.9) return 'Pricey';
  return 'Extortionate';
}

function getAvailableLlamas() {
  const activeResidentIds = gameState.communeResidents.filter(r => !r.churned).map(r => r.id);
  const pendingIds = gameState.pendingArrivals.map(r => r.id);
  return llamaPool.filter(l => !activeResidentIds.includes(l.id) && !pendingIds.includes(l.id));
}

function getRandomArrivalDay() {
  const days = [2, 3, 4, 5, 6, 7];
  return days[Math.floor(Math.random() * days.length)];
}

function processTick() {
  if (gameState.isGameOver || gameState.isPausedForWeeklyDecision) return;

  const previousDay = gameState.day;
  gameState.hour += gameConfig.hoursPerTick;
  
  if (gameState.hour >= 24) {
    gameState.hour = gameState.hour % 24;
    gameState.day += 1;
    
    if (gameState.day > 7) {
      processWeekEnd();
      return;
    }
    
    gameState.dayName = DAY_NAMES[gameState.day - 1] || 'Monday';
    
    const arrivingToday = gameState.pendingArrivals.filter(r => r.arrivalDay === gameState.day);
    arrivingToday.forEach(resident => {
      const daysRemaining = 8 - gameState.day;
      const existingChurned = gameState.communeResidents.find(r => r.id === resident.id && r.churned);
      if (existingChurned) {
        existingChurned.churned = false;
        existingChurned.daysThisWeek = daysRemaining;
        existingChurned.arrivalDay = null;
      } else {
        gameState.communeResidents.push({
          ...resident,
          daysThisWeek: daysRemaining,
          arrivalDay: null
        });
      }
    });
    gameState.pendingArrivals = gameState.pendingArrivals.filter(r => r.arrivalDay !== gameState.day);
  }
  
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();

  if (gameState.day !== previousDay || gameState.metricHistory.length === 0) {
    gameState.metricHistory.push({
      week: gameState.week,
      day: gameState.day,
      ls: Math.round((gameState.healthMetrics.livingStandards || 0) * 100),
      pr: Math.round((gameState.healthMetrics.productivity || 0) * 100),
      pt: Math.round((gameState.healthMetrics.partytime || 0) * 100)
    });
  }
  
  const ticksPerDay = 24 / gameConfig.hoursPerTick;
  const ticksPerWeek = ticksPerDay * 7;
  
  let weeklyIncome = 0;
  gameState.communeResidents.filter(r => !r.churned).forEach(resident => {
    const proRataRent = Math.ceil((resident.daysThisWeek / 7) * gameState.currentRent);
    weeklyIncome += proRataRent;
  });
  
  const totalBudget = Object.values(gameState.budgets).reduce((sum, v) => sum + v, 0);
  const totalFixedCosts = (gameState.activeFixedCosts || []).reduce((sum, fcId) => {
    const cfg = techConfig[fcId];
    return sum + (cfg?.weeklyCost || 0);
  }, 0);
  const weeklyExpenses = calculateGroundRent() + calculateUtilities() + totalBudget + totalFixedCosts;
  const tickIncome = weeklyIncome / ticksPerWeek;
  const tickExpenses = weeklyExpenses / ticksPerWeek;
  gameState.treasury += tickIncome - tickExpenses;

  if (gameState.treasury <= gameConfig.gameOverLimit) {
    gameState.isGameOver = true;
    stopSimulation();
  }
}

function processWeekEnd() {
  const churnCount = calculateWeeklyChurnCount();
  const churnedResidents = [];
  
  const activeResidents = gameState.communeResidents.filter(r => !r.churned);
  for (let i = 0; i < churnCount && activeResidents.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * activeResidents.length);
    const churned = activeResidents.splice(randomIndex, 1)[0];
    churned.churned = true;
    churnedResidents.push(churned);
  }

  const actualProfit = gameState.treasury - gameState.treasuryAtWeekStart;
  
  gameState.lastWeekSummary = {
    week: gameState.week,
    income: gameState.projectedIncome,
    groundRent: gameState.projectedGroundRent,
    utilities: gameState.projectedUtilities,
    budget: gameState.projectedBudget || 0,
    fixedCosts: gameState.projectedFixedCosts || 0,
    totalExpenses: gameState.projectedGroundRent + gameState.projectedUtilities + (gameState.projectedBudget || 0) + (gameState.projectedFixedCosts || 0),
    profit: actualProfit,
    arrivedResidents: [],
    churnedResidents: churnedResidents.map(r => r.name)
  };

  gameState.communeResidents.forEach(r => r.daysThisWeek = 7);

  if (gameState.researchingTech) {
    const completedTechId = gameState.researchingTech;
    gameState.researchedTechs.push(completedTechId);
    gameState.researchCompletedThisWeek = completedTechId;
    gameState.researchingTech = null;
    calculatePrimitives();
    calculateHealthMetrics();
    calculateVibes();
  } else {
    gameState.researchCompletedThisWeek = null;
  }
  
  const prevPolicies = [...(gameState.previousPolicies || [])];
  const currPolicies = [...(gameState.activePolicies || [])];
  const policiesUnchanged = prevPolicies.length === currPolicies.length && 
    prevPolicies.every(p => currPolicies.includes(p));
  if (currPolicies.length >= 3 && policiesUnchanged) {
    gameState.policiesStableWeeks = (gameState.policiesStableWeeks || 0) + 1;
  } else if (currPolicies.length >= 3) {
    gameState.policiesStableWeeks = 1;
  } else {
    gameState.policiesStableWeeks = 0;
  }
  gameState.previousPolicies = [...currPolicies];
  gameState.policyChangesThisWeek = 0;

  gameState.week += 1;
  gameState.day = 1;
  gameState.hour = 9;
  gameState.dayName = 'Monday';
  gameState.hasRecruitedThisWeek = false;
  gameState.hasResearchedThisWeek = false;
  gameState.buildsThisWeek = 0;
  gameState.treasuryAtWeekStart = gameState.treasury;
  gameState.isPausedForWeeklyDecision = true;
  stopSimulation();
  
  calculateWeeklyProjection();
  generateWeekCandidates();
}

function startSimulation() {
  if (simulationInterval) return;
  if (gameState.isPausedForWeeklyDecision) return;
  gameState.isRunning = true;
  simulationInterval = setInterval(() => {
    processTick();
  }, gameConfig.tickSpeed);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  gameState.isRunning = false;
}

function dismissWeeklyPause() {
  if (!gameState.isPausedForWeeklyDecision) return;
  gameState.isPausedForWeeklyDecision = false;
  calculateWeeklyProjection();
  startSimulation();
}

initializeGame();

app.get('/api/state', (req, res) => {
  const capacity = calculateTotalCapacity();
  const residentCount = gameState.communeResidents.length;
  const pendingCount = gameState.pendingArrivals.length;
  res.json({
    ...gameState,
    residents: residentCount,
    pendingResidents: pendingCount,
    capacity,
    config: gameConfig,
    recruitmentSlots: calculateRecruitmentSlots(),
    rentTier: calculateRentTier(gameState.currentRent),
    rentTierThresholds: gameConfig.rentTierThresholds,
    primitiveConfig,
    healthConfig,
    vibesConfig,
    tierConfig,
    budgetConfig,
    policyConfig,
    policyDefinitions: POLICY_DEFINITIONS,
    techConfig,
    techTree: TECH_TREE
  });
});

app.get('/api/config', (req, res) => {
  res.json(gameConfig);
});

app.post('/api/config', (req, res) => {
  stopSimulation();
  const newConfig = { ...savedDefaults, ...req.body };
  initializeGame(newConfig);
  res.json({ success: true, config: gameConfig, state: gameState });
});

app.post('/api/save-defaults', (req, res) => {
  savedDefaults = { 
    ...gameConfig,
    primitives: { ...primitiveConfig },
    health: { ...healthConfig },
    vibes: { ...vibesConfig },
    tierConfig: { ...tierConfig },
    budgetConfig: JSON.parse(JSON.stringify(budgetConfig)),
    policyConfig: JSON.parse(JSON.stringify(policyConfig)),
    techConfig: JSON.parse(JSON.stringify(techConfig))
  };
  savedLlamaPool = JSON.parse(JSON.stringify(llamaPool));
  savedBuildingsConfig = gameState.buildings.map(b => ({ ...b }));
  
  // Persist to file
  try {
    const dataToSave = {
      defaults: savedDefaults,
      llamaPool: savedLlamaPool,
      buildings: savedBuildingsConfig
    };
    fs.writeFileSync(SAVED_DEFAULTS_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('Saved defaults to file');
  } catch (err) {
    console.error('Failed to save defaults to file:', err);
  }
  
  res.json({ success: true, defaults: savedDefaults });
});

app.get('/api/primitive-config', (req, res) => {
  res.json(primitiveConfig);
});

app.post('/api/primitive-config', (req, res) => {
  primitiveConfig = { ...primitiveConfig, ...req.body };
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: primitiveConfig });
});

app.get('/api/health-config', (req, res) => {
  res.json(healthConfig);
});

app.post('/api/health-config', (req, res) => {
  healthConfig = { ...healthConfig, ...req.body };
  if (req.body.livingStandards) healthConfig.livingStandards = { ...healthConfig.livingStandards, ...req.body.livingStandards };
  if (req.body.productivity) healthConfig.productivity = { ...healthConfig.productivity, ...req.body.productivity };
  if (req.body.partytime) healthConfig.partytime = { ...healthConfig.partytime, ...req.body.partytime };
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: healthConfig });
});

app.get('/api/vibes-config', (req, res) => {
  res.json(vibesConfig);
});

app.post('/api/vibes-config', (req, res) => {
  vibesConfig = { ...vibesConfig, ...req.body };
  calculateVibes();
  res.json({ success: true, config: vibesConfig });
});

app.get('/api/tier-config', (req, res) => {
  res.json(tierConfig);
});

app.post('/api/tier-config', (req, res) => {
  tierConfig = { ...tierConfig, ...req.body };
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: tierConfig });
});

app.get('/api/budget-config', (req, res) => {
  res.json(budgetConfig);
});

app.post('/api/budget-config', (req, res) => {
  const updates = req.body;
  for (const key of Object.keys(budgetConfig)) {
    if (updates[key]) {
      budgetConfig[key] = { ...budgetConfig[key], ...updates[key] };
    }
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: budgetConfig });
});

app.post('/api/action/toggle-policy', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    return res.status(400).json({ error: 'Can only change policies during weekly planning' });
  }
  const { policyId } = req.body;
  const policy = POLICY_DEFINITIONS.find(p => p.id === policyId);
  if (!policy) {
    return res.status(400).json({ error: 'Unknown policy' });
  }
  if (policy.techRequired && !gameState.researchedTechs.includes(policy.techRequired)) {
    return res.status(400).json({ error: 'Technology not yet researched' });
  }
  
  const maxChanges = gameConfig.policyChangesPerWeek ?? 1;
  const policyLimitActive = gameState.policiesStableWeeks >= 1 && gameState.previousPolicies.length >= 3;
  if (policyLimitActive && gameState.policyChangesThisWeek >= maxChanges) {
    return res.status(400).json({ error: `Policy change limit reached (${maxChanges}/week)` });
  }

  const idx = gameState.activePolicies.indexOf(policyId);
  const action = idx >= 0 ? 'deactivated' : 'activated';
  if (idx >= 0) {
    gameState.activePolicies.splice(idx, 1);
  } else {
    gameState.activePolicies.push(policyId);
  }
  
  if (policyLimitActive) {
    gameState.policyChangesThisWeek += 1;
  }
  
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, activePolicies: gameState.activePolicies, action, policyId });
});

app.get('/api/policy-config', (req, res) => {
  res.json(policyConfig);
});

app.post('/api/policy-config', (req, res) => {
  const updates = req.body;
  if (updates.excludePercent !== undefined) {
    policyConfig.excludePercent = Math.max(0, Math.min(1, Number(updates.excludePercent) || 0.25));
  }
  if (updates.funPenalty) {
    policyConfig.funPenalty = { ...policyConfig.funPenalty, ...updates.funPenalty };
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  res.json({ success: true, config: policyConfig });
});

app.post('/api/action/research', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    return res.status(400).json({ error: 'Can only research during weekly planning' });
  }
  if (gameState.hasResearchedThisWeek || gameState.researchingTech) {
    return res.status(400).json({ error: 'Already researching this week' });
  }
  const { techId } = req.body;
  const tech = TECH_TREE.find(t => t.id === techId);
  if (!tech) {
    return res.status(400).json({ error: 'Unknown technology' });
  }
  if (!tech.available) {
    return res.status(400).json({ error: 'Technology not yet available' });
  }
  if (gameState.researchedTechs.includes(techId)) {
    return res.status(400).json({ error: 'Already researched' });
  }
  if (tech.parent && !gameState.researchedTechs.includes(tech.parent)) {
    return res.status(400).json({ error: 'Must research prerequisite first' });
  }
  const cost = techConfig[techId]?.cost || 500;
  if (gameState.treasury < cost) {
    return res.status(400).json({ error: 'Not enough funds' });
  }
  
  gameState.treasury -= cost;
  gameState.researchingTech = techId;
  gameState.hasResearchedThisWeek = true;
  
  calculateWeeklyProjection();
  
  res.json({ 
    success: true, 
    researching: techId,
    treasury: gameState.treasury
  });
});

app.post('/api/action/cancel-research', (req, res) => {
  if (!gameState.researchingTech) {
    return res.status(400).json({ error: 'No research in progress' });
  }
  const cost = techConfig[gameState.researchingTech]?.cost || 500;
  gameState.treasury += cost;
  gameState.researchingTech = null;
  gameState.hasResearchedThisWeek = false;
  calculateWeeklyProjection();
  res.json({ success: true, treasury: gameState.treasury });
});

app.post('/api/action/toggle-fixed-cost', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    return res.status(400).json({ error: 'Can only toggle fixed costs during weekly planning' });
  }
  const { fixedCostId } = req.body;
  if (!gameState.researchedTechs.includes(fixedCostId)) {
    return res.status(400).json({ error: 'Technology not yet researched' });
  }
  const tech = TECH_TREE.find(t => t.id === fixedCostId && t.type === 'fixed_expense');
  if (!tech) {
    return res.status(400).json({ error: 'Not a valid fixed cost item' });
  }
  const idx = gameState.activeFixedCosts.indexOf(fixedCostId);
  if (idx >= 0) {
    gameState.activeFixedCosts.splice(idx, 1);
  } else {
    gameState.activeFixedCosts.push(fixedCostId);
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  calculateWeeklyProjection();
  res.json({ success: true, activeFixedCosts: gameState.activeFixedCosts });
});

app.get('/api/tech-config', (req, res) => {
  res.json(techConfig);
});

app.post('/api/tech-config', (req, res) => {
  const updates = req.body;
  for (const key of Object.keys(updates)) {
    if (techConfig[key]) {
      techConfig[key] = { ...techConfig[key], ...updates[key] };
    }
  }
  calculatePrimitives();
  calculateHealthMetrics();
  calculateVibes();
  calculateWeeklyProjection();
  res.json({ success: true, config: techConfig });
});

app.get('/api/llama-pool', (req, res) => {
  res.json({ llamas: llamaPool });
});

app.post('/api/llama-pool', (req, res) => {
  const { llamas } = req.body;
  if (!llamas || !Array.isArray(llamas)) {
    res.status(400).json({ error: 'Invalid llama pool data' });
    return;
  }
  llamaPool = llamas;
  generateWeekCandidates();
  res.json({ success: true, llamas: llamaPool });
});

app.post('/api/reset', (req, res) => {
  stopSimulation();
  initializeGame(savedDefaults);
  res.json({ success: true, state: gameState });
});

app.post('/api/start', (req, res) => {
  if (gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Dismiss weekly decision modal first' });
    return;
  }
  startSimulation();
  res.json({ success: true, isRunning: true });
});

app.post('/api/pause', (req, res) => {
  stopSimulation();
  res.json({ success: true, isRunning: false });
});

app.post('/api/dismiss-weekly', (req, res) => {
  dismissWeeklyPause();
  res.json({ success: true, isRunning: gameState.isRunning, isPausedForWeeklyDecision: false });
});

app.post('/api/action/set-rent', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only change rent during weekly planning' });
    return;
  }
  const { rent } = req.body;
  if (rent >= gameConfig.rentMin && rent <= gameConfig.rentMax) {
    gameState.currentRent = rent;
    calculateWeeklyProjection();
    res.json({ success: true, currentRent: gameState.currentRent });
  } else {
    res.status(400).json({ error: `Rent must be between £${gameConfig.rentMin} and £${gameConfig.rentMax}` });
  }
});

app.post('/api/action/set-budget', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only set budgets during weekly planning' });
    return;
  }
  const { budgets } = req.body;
  if (budgets && typeof budgets === 'object') {
    for (const key of Object.keys(gameState.budgets)) {
      if (budgets[key] !== undefined) {
        gameState.budgets[key] = Math.max(0, Number(budgets[key]) || 0);
      }
    }
    calculateWeeklyProjection();
    res.json({ success: true, budgets: gameState.budgets });
  } else {
    res.status(400).json({ error: 'Invalid budget data' });
  }
});

app.get('/api/recruitment-candidates', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only recruit during weekly planning' });
    return;
  }
  
  const residentIds = gameState.communeResidents.map(r => r.id);
  const pendingIds = gameState.pendingArrivals.map(r => r.id);
  const excludeIds = new Set([...residentIds, ...pendingIds]);
  const availableCandidates = gameState.weekCandidates.filter(c => !excludeIds.has(c.id));
  
  res.json({ candidates: availableCandidates });
});

app.post('/api/action/invite', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only recruit during weekly planning' });
    return;
  }
  
  if (gameState.hasRecruitedThisWeek) {
    res.status(400).json({ error: 'Already recruited this week' });
    return;
  }
  
  const capacity = calculateTotalCapacity();
  const activeResidents = gameState.communeResidents.filter(r => !r.churned).length;
  const futureResidents = activeResidents + gameState.pendingArrivals.length + 1;
  
  if (futureResidents > capacity) {
    res.status(400).json({ error: 'Not enough capacity' });
    return;
  }
  
  const { llamaId } = req.body;
  const llama = llamaPool.find(l => l.id === llamaId);
  
  if (!llama) {
    res.status(400).json({ error: 'Llama not found' });
    return;
  }
  
  const inCommune = gameState.communeResidents.some(r => r.id === llamaId && !r.churned);
  const isPending = gameState.pendingArrivals.some(r => r.id === llamaId);
  
  if (inCommune || isPending) {
    res.status(400).json({ error: 'Llama already in commune or pending' });
    return;
  }
  
  const arrivalDay = getRandomArrivalDay();
  gameState.pendingArrivals.push({
    ...llama,
    arrivalDay,
    daysThisWeek: 0
  });
  gameState.hasRecruitedThisWeek = true;
  
  res.json({ 
    success: true, 
    invited: llama.name, 
    arrivalDay,
    arrivalDayName: DAY_NAMES[arrivalDay - 1]
  });
});

app.post('/api/action/build', (req, res) => {
  if (!gameState.isPausedForWeeklyDecision) {
    res.status(400).json({ error: 'Can only build during weekly planning' });
    return;
  }
  
  const { buildingId } = req.body;
  const building = gameState.buildings.find(b => b.id === buildingId);
  
  if (!building) {
    res.status(400).json({ error: 'Building type not found' });
    return;
  }
  
  if (!building.buildable || building.cost === null) {
    res.status(400).json({ error: 'This building type cannot be built' });
    return;
  }
  
  if (building.techRequired && !gameState.researchedTechs.includes(building.techRequired)) {
    res.status(400).json({ error: 'Required technology not yet researched' });
    return;
  }
  
  const maxBuilds = gameConfig.buildsPerWeek ?? 1;
  if ((gameState.buildsThisWeek || 0) >= maxBuilds) {
    res.status(400).json({ error: `Build limit reached (${maxBuilds} per week)` });
    return;
  }
  
  if (gameState.treasury < building.cost) {
    res.status(400).json({ error: 'Not enough funds' });
    return;
  }
  
  gameState.treasury -= building.cost;
  building.count += 1;
  gameState.buildsThisWeek = (gameState.buildsThisWeek || 0) + 1;
  calculateWeeklyProjection();
  res.json({ 
    success: true, 
    building: building.name,
    count: building.count,
    treasury: gameState.treasury,
    capacity: calculateTotalCapacity()
  });
});

app.post('/api/action/build-bedroom', (req, res) => {
  req.body = { buildingId: 'bedroom' };
  return app._router.handle({ ...req, url: '/api/action/build', method: 'POST' }, res, () => {});
});

app.get('/api/buildings', (req, res) => {
  res.json(gameState.buildings);
});

app.post('/api/buildings', (req, res) => {
  const { buildings } = req.body;
  if (!buildings || !Array.isArray(buildings)) {
    res.status(400).json({ error: 'Invalid buildings data' });
    return;
  }
  gameState.buildings = buildings.map(b => ({
    ...b,
    count: b.count !== undefined ? b.count : b.atStart
  }));
  calculateWeeklyProjection();
  res.json({ success: true, buildings: gameState.buildings });
});

app.get('/api/buildings-config', (req, res) => {
  const config = savedBuildingsConfig ? [...savedBuildingsConfig] : JSON.parse(JSON.stringify(DEFAULT_BUILDINGS));
  if (savedBuildingsConfig) {
    DEFAULT_BUILDINGS.forEach(def => {
      if (!config.find(b => b.id === def.id)) {
        config.push(JSON.parse(JSON.stringify(def)));
      }
    });
  }
  res.json(config);
});

app.post('/api/buildings-config', (req, res) => {
  const { buildings } = req.body;
  if (!buildings || !Array.isArray(buildings)) {
    res.status(400).json({ error: 'Invalid buildings config' });
    return;
  }
  savedBuildingsConfig = buildings;
  res.json({ success: true, buildings: savedBuildingsConfig });
});

app.get('/api/llamas', (req, res) => {
  res.json({ llamas: llamaPool });
});

app.post('/api/llamas', (req, res) => {
  const { llamas } = req.body;
  if (!Array.isArray(llamas)) {
    res.status(400).json({ error: 'llamas must be an array' });
    return;
  }
  llamaPool = llamas;
  res.json({ success: true, count: llamaPool.length });
});

app.post('/api/llamas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;
  const index = llamaPool.findIndex(l => l.id === id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Llama not found' });
    return;
  }
  
  llamaPool[index] = { ...llamaPool[index], ...updates };
  res.json({ success: true, llama: llamaPool[index] });
});

app.post('/api/llamas/add', (req, res) => {
  const newLlama = req.body;
  const maxId = Math.max(...llamaPool.map(l => l.id), 0);
  newLlama.id = maxId + 1;
  llamaPool.push(newLlama);
  res.json({ success: true, llama: newLlama });
});

app.delete('/api/llamas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = llamaPool.findIndex(l => l.id === id);
  
  if (index === -1) {
    res.status(404).json({ error: 'Llama not found' });
    return;
  }
  
  llamaPool.splice(index, 1);
  res.json({ success: true });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fort Llama server running on port ${PORT}`);
});
