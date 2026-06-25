import { EmergencyIssuePreset } from "./types";

export const PRIMARY_EMERGENCY_PRESETS: EmergencyIssuePreset[] = [
  {
    id: "choking",
    label: "Choking",
    icon: "Activity",
    description: "Inability to breathe or speak due to airway block",
    guide: {
      title: "First Aid for Choking (Adult/Child)",
      severity: "Critical",
      whoRef: "World Health Organization Basic Emergency Care (BEC) Standards",
      steps: [
        "Assess: Ask 'Are you choking?' If they can speak or cough, encourage coughing.",
        "Perform Back Blows: Lean them forward. Give 5 firm blows between shoulder blades with heel of your hand.",
        "Perform Abdominal Thrusts (Heimlich): Wrap arms around waist from behind. Make a fist.",
        "Execute Thrusts: Place fist just above belly button. Pull quickly inward and upward 5 times.",
        "Repeat Loop: Alternate 5 back blows and 5 abdominal thrusts until object is dislodged.",
        "Unconscious Rescue: If they lose consciousness, lower to ground and start CPR (chest compressions)."
      ],
      dos: [
        "Lean the choking person forward so the dislodged object falls out of the mouth, not back down.",
        "Encourage coughing if the person can breathe or speak.",
        "Call emergency services immediately if the airway remains blocked after 1 minute."
      ],
      donts: [
        "Do NOT perform blind finger sweeps inside the mouth as you may push the object deeper.",
        "Do NOT perform abdominal thrusts on pregnant women or infants (use chest thrusts instead).",
        "Do NOT hit them on the back while they are in an upright standing position."
      ],
      emergencyContactRequired: true
    }
  },
  {
    id: "severe-bleeding",
    label: "Bleeding",
    icon: "HeartOff",
    description: "Rapid, continuous, or spurting blood loss from a wound",
    guide: {
      title: "First Aid for Severe Bleeding",
      severity: "Critical",
      whoRef: "WHO Trauma Care Guidelines & International Wound Standards",
      steps: [
        "Safety Check: Wear gloves if available to prevent cross-contamination.",
        "Apply Direct Pressure: Press firmly on the wound with a clean sterile cloth or your bare hands.",
        "Maintain Pressure: Hold continuous, firm pressure with no breaks for at least 5-10 minutes.",
        "Elevate: If possible, elevate the bleeding limb above the level of the heart.",
        "Apply Bandage: Wrap a clean bandage snugly over the dressing. Do not cut off circulation.",
        "Secondary Dressing: If blood seeps through, place another pad directly over it. Do NOT remove first pad."
      ],
      dos: [
        "Keep the patient lying down and warm to prevent shock.",
        "Keep pressure firm and uninterrupted until medical help arrives.",
        "Use sterile or cleanest available fabrics first."
      ],
      donts: [
        "Do NOT remove blood-soaked dressings, as this disrupts the forming clot.",
        "Do NOT apply a tight tourniquet unless trained and pressure has completely failed.",
        "Do NOT wash or clean a wound that is actively bleeding heavily."
      ],
      emergencyContactRequired: true
    }
  },
  {
    id: "burns",
    label: "Burns",
    icon: "Flame",
    description: "Thermal, electrical, or chemical skin tissue damage",
    guide: {
      title: "First Aid for Thermal Burns",
      severity: "Moderate",
      whoRef: "WHO Burn Management & Care Guidelines",
      steps: [
        "Cool Immediate: Flush the burned area under cool running water for 15-20 minutes.",
        "Remove Constrictions: Gently remove rings, jewelry, or tight clothing before swelling starts.",
        "Do NOT peel: If clothing is stuck to the burn, leave it. Wet around it instead.",
        "Cover loosely: Cover the cooled burn loosely with clean plastic wrap or a sterile non-stick bandage.",
        "Pain Management: Keep the victim hydrated and seated in a comfortable cool state."
      ],
      dos: [
        "Use ONLY cool, clean running water (15°C to 25°C).",
        "Cover the burn to protect from dirt and bacterial infection.",
        "Seek medical care if burn is larger than the victim's palm."
      ],
      donts: [
        "Do NOT apply ice, ice water, butter, oils, toothpaste, or traditional home remedies.",
        "Do NOT pop blisters. Intact skin protects against severe infection.",
        "Do NOT use fluffy cotton dressings that can lint and stick to the wound."
      ],
      emergencyContactRequired: false
    }
  },
  {
    id: "fracture",
    label: "Fracture",
    icon: "ShieldAlert",
    description: "Broken, cracked, or deformed bone structure",
    guide: {
      title: "First Aid for Fractures & Joint Injuries",
      severity: "Moderate",
      whoRef: "WHO Essential Trauma Care Guidelines",
      steps: [
        "Immobilize: Keep the injured limb completely still. Do not try to move the person.",
        "Support Splint: Protect the joint above and below the break using folded cardboard or wood.",
        "Secure Splint: Tie splints securely with cloth bands. Do not tie directly over the fracture point.",
        "Elevate & Cold: Apply wrapped ice packs to reduce swelling (wrapped in cloth, not bare skin).",
        "Control Bleeding: If bone is protruding (open fracture), apply pressure around bone, do NOT press bone.",
        "Treat Shock: Keep them warm, calm, and resting flat."
      ],
      dos: [
        "Wrap ice packs in a clean cloth. Never apply cold source directly to skin.",
        "Support the bone securely in the position you found it.",
        "Check circulation below the splint periodically (pulse or warmth)."
      ],
      donts: [
        "Do NOT try to realign, straighten, or pop a bone back into place.",
        "Do NOT let the person walk or bear weight if a lower limb fracture is suspected.",
        "Do NOT give anything to eat or drink in case emergency surgery is needed."
      ],
      emergencyContactRequired: true
    }
  },
  {
    id: "heart-attack",
    label: "Heart Attack",
    icon: "HeartPulse",
    description: "Crushing chest pain, shortness of breath, left-arm discomfort",
    guide: {
      title: "First Aid for Suspected Heart Attack",
      severity: "Critical",
      whoRef: "WHO Cardiovascular Medical Emergency Guidelines",
      steps: [
        "Call Help First: Call local emergency services (911) immediately. Do not wait.",
        "Rest Comfortable: Have them sit on the floor in a 'W-position' with back supported and knees bent.",
        "Loosen Clothes: Loosen tight collars, ties, belts, or chest pieces.",
        "Provide Aspirin: If fully conscious and not allergic, let them chew 300mg of standard Aspirin.",
        "Monitor Vitals: Keep speaking to them and monitor breathing. Record details for paramedics.",
        "Be Ready for CPR: If they stop breathing, begin high-quality chest compressions immediately."
      ],
      dos: [
        "Stay with the person and keep them calm. Anxiety increases workload on the heart.",
        "Make sure to keep them physically resting. Do NOT walk them.",
        "Gather all current medications they take to show emergency staff."
      ],
      donts: [
        "Do NOT let them drive themselves to the hospital.",
        "Do NOT give aspirin if they are allergic, or have been told never to take it.",
        "Do NOT ignore symptoms like severe jaw, back, or neck pain combined with sweating."
      ],
      emergencyContactRequired: true
    }
  },
  {
    id: "heatstroke",
    label: "Heat Stroke",
    icon: "Sun",
    description: "Very high body temp, confusion, skin dry or heavy sweating",
    guide: {
      title: "First Aid for Heat Stroke & Exhaustion",
      severity: "Critical",
      whoRef: "WHO Environmental Health & Heatwave Safety Standards",
      steps: [
        "Relocate: Move the person into a cool, air-conditioned, or well-shaded place.",
        "Active Cooling: Remove excess clothing. Spray or sponge them with cool water.",
        "Maximize Airflow: Fan them vigorously to speed up evaporation cooling.",
        "Ice Pointing: Apply cool wet towels or ice packs to neck, armpits, and groin.",
        "Rehydrate Sips: If fully conscious and swallowing well, give small sips of cool water.",
        "Continuous Vitals: Monitor closely. Heat stroke is fatal if core temperature is unchecked."
      ],
      dos: [
        "Fanning and wetting skin is the fastest surface cooling methodology.",
        "Keep the person recumbent with feet slightly raised."
      ],
      donts: [
        "Do NOT give paracetamol or aspirin; they will not work for environmental heat fever.",
        "Do NOT give fluids to someone who is confused, drowsy, or vomiting.",
        "Do NOT plunge them into an ice bath unsupervised due to risk of shock."
      ],
      emergencyContactRequired: true
    }
  },
  {
    id: "poisoning",
    label: "Poisoning",
    icon: "Sparkles", // represents chemical or substance hazard
    description: "Ingestion, inhalation, or skin contact with toxic substances",
    guide: {
      title: "First Aid for Poisoning & Toxic Exposure",
      severity: "Critical",
      whoRef: "WHO International Programme on Chemical Safety Guidelines",
      steps: [
        "Identify Source: Safely secure the container, label, or substance to identify chemical name.",
        "Dermal/Ocular: If skin/eyes are contacted, rinse continuously with running water for 15 minutes.",
        "Airways/Gas: If inhaled, move them immediately to fresh open air.",
        "Mouth Sweep: If ingested, wash the mouth carefully. Spit out remaining substances.",
        "Call Poison Center: Phone emergency toxic services or hospital immediately.",
        "Positioning: If they are drowsy or vomit, place them in the 'Recovery Position' on their side."
      ],
      dos: [
        "Save vomiting specimens in a container if poison source is unknown.",
        "Keep the air flowing and loosen tight clothing."
      ],
      donts: [
        "Do NOT induce vomiting unless explicitly directed by poison expert; acids can re-burn the throat.",
        "Do NOT give charcoal, milk, or home remedies without specialist instructions."
      ],
      emergencyContactRequired: true
    }
  },
  {
    id: "electric-shock",
    label: "Electric Shock",
    icon: "Zap",
    description: "Current passage through body tissue with nerve/skin burns",
    guide: {
      title: "First Aid for Low/High Voltage Electric Shock",
      severity: "Critical",
      whoRef: "WHO Occupational Safety & Trauma Standards",
      steps: [
        "Establish Safety: Do NOT touch the victim if they are still in contact with current.",
        "Shut Off Power: Turn off mains fuse breaker or pull away cord with wooden broom handle.",
        "Check Breathing: Once disconnected, verify standard breathing. Start CPR if pulse is absent.",
        "Address Burns: Cover electrical entrance and exit wounds with dry sterile dressings.",
        "Stabilize Head: Treat as spinal fracture risk if they fell from a height.",
        "Await Help: Call emergency paramedics immediately. Internal heart rhythms may be unstable."
      ],
      dos: [
        "Use dry dry wood, plastic, or rubber insulators to separate wire from skin if main switch is unreachable.",
        "Seek immediate professional evaluation; electrical burns damage deep internal tissue unseen."
      ],
      donts: [
        "Do NOT touch the victim with bare hands/wet materials while power is active.",
        "Do NOT apply wet compresses or water to active electrical burns."
      ],
      emergencyContactRequired: true
    }
  }
];
