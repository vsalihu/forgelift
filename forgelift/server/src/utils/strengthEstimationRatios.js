export const confidenceRank = {
  Low: 1,
  Medium: 2,
  High: 3
};

export const strengthEstimationRatios = {
  "Bench Press": [
    { exerciseName: "Incline Bench Press", ratio: 0.85, confidence: "Medium", note: "Incline pressing usually starts below flat bench strength." },
    { exerciseName: "Decline Bench Press", ratio: 0.95, confidence: "High", note: "Decline bench is usually close to flat bench strength." },
    { exerciseName: "Dumbbell Bench Press", ratio: 0.75, confidence: "Medium", note: "Total dumbbell load estimate. Split across both dumbbells." },
    { exerciseName: "Incline Dumbbell Press", ratio: 0.68, confidence: "Medium", note: "Total dumbbell load estimate. Split across both dumbbells." },
    { exerciseName: "Chest Press Machine", ratio: 0.95, confidence: "Medium", note: "Machine loading can vary by machine design." },
    { exerciseName: "Smith Machine Bench Press", ratio: 0.98, confidence: "Medium", note: "Smith machine strength is close to flat bench but machine path changes difficulty." },
    { exerciseName: "Close-Grip Bench Press", ratio: 0.8, confidence: "Medium", note: "Close-grip bench shifts more work to triceps." },
    { exerciseName: "Dip", ratio: 0.55, confidence: "Low", note: "Bodyweight and added-load movements vary a lot by setup." },
    { exerciseName: "Weighted Push-Up", ratio: 0.55, confidence: "Low", note: "Push-up loading depends on body position and added load." },
    { exerciseName: "Push-Up", ratio: 0.35, confidence: "Low", note: "Bodyweight estimate only. Adjust by feel." },
    { exerciseName: "Cable Fly", ratio: 0.3, confidence: "Low", note: "Fly estimates should be treated very conservatively." },
    { exerciseName: "Low Cable Fly", ratio: 0.28, confidence: "Low", note: "Fly estimates should be treated very conservatively." },
    { exerciseName: "High Cable Fly", ratio: 0.28, confidence: "Low", note: "Fly estimates should be treated very conservatively." },
    { exerciseName: "Pec Deck", ratio: 0.4, confidence: "Low", note: "Machine loading varies widely." },
    { exerciseName: "Dumbbell Fly", ratio: 0.28, confidence: "Low", note: "Total dumbbell load estimate for a strict fly." }
  ],
  Squat: [
    { exerciseName: "Front Squat", ratio: 0.78, confidence: "Medium", note: "Front squats usually sit below back squat strength." },
    { exerciseName: "Hack Squat", ratio: 0.95, confidence: "Medium", note: "Machine leverage varies by model." },
    { exerciseName: "Leg Press", ratio: 2.1, confidence: "Low", note: "Leg press loading varies heavily by machine angle." },
    { exerciseName: "Bulgarian Split Squat", ratio: 0.3, confidence: "Low", note: "Per-side estimate. Start conservatively." },
    { exerciseName: "Walking Lunge", ratio: 0.25, confidence: "Low", note: "Per-side estimate. Balance and control matter more than load." },
    { exerciseName: "Reverse Lunge", ratio: 0.25, confidence: "Low", note: "Per-side estimate. Start conservatively." },
    { exerciseName: "Goblet Squat", ratio: 0.35, confidence: "Low", note: "Goblet squats are limited by holding position." },
    { exerciseName: "Leg Extension", ratio: 0.45, confidence: "Low", note: "Isolation machine loading varies widely." },
    { exerciseName: "Box Squat", ratio: 0.92, confidence: "Medium", note: "Box height and pause change difficulty." },
    { exerciseName: "Smith Machine Squat", ratio: 0.9, confidence: "Medium", note: "Smith machine path changes stability demands." },
    { exerciseName: "Step-Up", ratio: 0.25, confidence: "Low", note: "Per-side estimate. Use control and balance first." }
  ],
  Deadlift: [
    { exerciseName: "Romanian Deadlift", ratio: 0.7, confidence: "Medium", note: "RDLs use less load and more controlled hinge range." },
    { exerciseName: "Rack Pull", ratio: 1, confidence: "Medium", note: "Rack height changes the estimate substantially." },
    { exerciseName: "Sumo Deadlift", ratio: 0.95, confidence: "Medium", note: "Stance and leverages can change this either direction." },
    { exerciseName: "Stiff-Leg Deadlift", ratio: 0.65, confidence: "Medium", note: "Start lighter because hamstring demand is high." },
    { exerciseName: "Good Morning", ratio: 0.4, confidence: "Low", note: "Technique-sensitive movement. Start light." },
    { exerciseName: "Barbell Row", ratio: 0.5, confidence: "Low", note: "Row strength does not transfer directly from deadlift." },
    { exerciseName: "T-Bar Row", ratio: 0.55, confidence: "Low", note: "Use as a conservative pulling estimate." }
  ],
  "Overhead Press": [
    { exerciseName: "Seated Dumbbell Shoulder Press", ratio: 0.68, confidence: "Medium", note: "Total dumbbell load estimate. Split across both dumbbells." },
    { exerciseName: "Arnold Press", ratio: 0.55, confidence: "Low", note: "Rotation and range of motion reduce loading." },
    { exerciseName: "Machine Shoulder Press", ratio: 0.8, confidence: "Medium", note: "Machine loading varies by design." },
    { exerciseName: "Landmine Press", ratio: 0.62, confidence: "Medium", note: "Angled press estimate. Setup changes difficulty." },
    { exerciseName: "Front Raise", ratio: 0.2, confidence: "Low", note: "Isolation estimate only." },
    { exerciseName: "Lateral Raise", ratio: 0.15, confidence: "Low", note: "Use light, strict reps for lateral raises." },
    { exerciseName: "Cable Lateral Raise", ratio: 0.12, confidence: "Low", note: "Cable loading should start light." },
    { exerciseName: "Pike Push-Up", ratio: 0.45, confidence: "Low", note: "Bodyweight leverage changes the real loading." }
  ],
  "Hip Thrust": [
    { exerciseName: "Barbell Hip Thrust", ratio: 1, confidence: "High", note: "Same movement pattern." },
    { exerciseName: "Glute Bridge", ratio: 0.8, confidence: "Medium", note: "Glute bridge range and setup are usually different." },
    { exerciseName: "Cable Kickback", ratio: 0.18, confidence: "Low", note: "Isolation estimate only. Start light." },
    { exerciseName: "Glute Machine Kickback", ratio: 0.25, confidence: "Low", note: "Machine loading varies by design." },
    { exerciseName: "Hip Abduction Machine", ratio: 0.35, confidence: "Low", note: "Accessory estimate only." },
    { exerciseName: "Cable Pull-Through", ratio: 0.42, confidence: "Low", note: "Hip hinge accessory estimate." },
    { exerciseName: "Romanian Deadlift", ratio: 0.55, confidence: "Low", note: "Hip thrust strength does not transfer directly to hinge strength." },
    { exerciseName: "Frog Pump", ratio: 0.2, confidence: "Low", note: "High-rep bodyweight-style estimate." }
  ],
  "Barbell Row": [
    { exerciseName: "Dumbbell Row", ratio: 0.42, confidence: "Medium", note: "Per-side dumbbell estimate." },
    { exerciseName: "Seated Cable Row", ratio: 0.8, confidence: "Medium", note: "Cable loading varies by stack and pulley." },
    { exerciseName: "T-Bar Row", ratio: 0.85, confidence: "Medium", note: "Similar horizontal row pattern." },
    { exerciseName: "Machine Row", ratio: 0.82, confidence: "Medium", note: "Machine loading varies by model." },
    { exerciseName: "Lat Pulldown", ratio: 0.72, confidence: "Low", note: "Vertical pull estimate from horizontal pull strength." },
    { exerciseName: "Face Pull", ratio: 0.3, confidence: "Low", note: "Rear delt accessory estimate only." },
    { exerciseName: "Rear Delt Row", ratio: 0.45, confidence: "Low", note: "Use strict form and lighter loading." }
  ],
  "Romanian Deadlift": [
    { exerciseName: "Stiff-Leg Deadlift", ratio: 0.9, confidence: "Medium", note: "Similar hinge pattern with slightly different knee bend." },
    { exerciseName: "Good Morning", ratio: 0.55, confidence: "Low", note: "Technique-sensitive movement. Start light." },
    { exerciseName: "Single-Leg Romanian Deadlift", ratio: 0.28, confidence: "Low", note: "Per-side estimate. Balance limits loading." },
    { exerciseName: "Seated Leg Curl", ratio: 0.35, confidence: "Low", note: "Isolation estimate only." },
    { exerciseName: "Lying Leg Curl", ratio: 0.35, confidence: "Low", note: "Isolation estimate only." },
    { exerciseName: "Cable Pull-Through", ratio: 0.6, confidence: "Low", note: "Accessory hinge estimate." }
  ],
  "Pull-up": [
    { exerciseName: "Chin-Up", ratio: 1, confidence: "Medium", note: "Similar bodyweight pull with more biceps involvement." },
    { exerciseName: "Lat Pulldown", ratio: 0.85, confidence: "Low", note: "Pulldown stack does not equal bodyweight load directly." },
    { exerciseName: "Close-Grip Lat Pulldown", ratio: 0.82, confidence: "Low", note: "Use as a conservative starting point." },
    { exerciseName: "Straight-Arm Pulldown", ratio: 0.35, confidence: "Low", note: "Accessory pulldown estimate only." },
    { exerciseName: "Seated Cable Row", ratio: 0.7, confidence: "Low", note: "Horizontal row estimate from vertical pull strength." }
  ]
};
