import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Visual guide metadata for each ISL gesture
const GESTURE_GUIDES = {
  FIRST: { icon: "☝️", pose: "Index Pointed Straight Up • Fist Clenched", desc: "ISL ordinal sign for '1st'" },
  SECOND: { icon: "✌️", pose: "Index & Middle in 'V' • Others Clenched", desc: "ISL ordinal sign for '2nd'" },
  THIRD: { icon: "🤟", pose: "Index, Middle, Ring Raised", desc: "ISL ordinal sign for '3rd'" },
  FOURTH: { icon: "🖖", pose: "Four Fingers Raised • Thumb Folded", desc: "ISL ordinal sign for '4th'" },
  PLEASE: { icon: "✋", pose: "Open Flat Palm • Chest Level Circular Motion", desc: "Polite circular rubbing movement" },
  YOUR: { icon: "🫱", pose: "Open Flat Palm Pushing Forward Toward Person", desc: "ISL possessive pronoun for 'your / you'" },
  THANK_YOU: { icon: "🙏", pose: "Hand from Chin ➔ Open Forward Toward Person", desc: "Respectful outward sign" },
  HELLO: { icon: "👋", pose: "Open Hand Near Forehead • Outward Wave", desc: "Respectful greeting wave" },
  WELCOME: { icon: "👐", pose: "Both Palms Up Sweeping Inward", desc: "Open welcoming sweep" },
  ID_CARD: { icon: "📇", pose: "Both Index Fingers Tracing Card Perimeter", desc: "Two-handed gesture outlining badge shape" },
  ADMISSION: { icon: "📄", pose: "Right Palm Slides Upward Along Left Palm", desc: "Indicates entry / admission pass" },
  OFFICE: { icon: "🏢", pose: "Both Hands Form 90° Wall Angles", desc: "Indicates walls / enclosed room" },
  FLOOR: { icon: "👇", pose: "Both Palms Facing Down • Sweeping Outward", desc: "Horizontal plane indicating floor level" },
  LIBRARY: { icon: "📖", pose: "Both Hands Open Like Book Pages", desc: "Fingertips mimic turning pages" },
  BRING: { icon: "🤲", pose: "Both Palms Facing Up • Drawing Inward to Body", desc: "Two-handed gesture drawing items toward chest" },
  WHERE: { icon: "🤷", pose: "Both Hands Open Palms-Up • Shrugging Side-to-Side", desc: "Questioning shrugging oscillation" },
  WHAT: { icon: "❓", pose: "Index Finger Pointed Up • Wagging Side-to-Side", desc: "Inquiring side wag" },
  PAY: { icon: "💰", pose: "Thumb & Index Finger Rubbing Tips", desc: "Simulating money / fee exchange" },
  SUBMIT: { icon: "📋", pose: "Both Hands Presenting Document Forward", desc: "Handing over paperwork" },
  HELP: { icon: "🤝", pose: "Left Palm Supports Right Thumbs-Up Fist", desc: "Supportive upward lift" },
  HOW: { icon: "🤲", pose: "Both Hands Roll Outward ➔ Palms Facing Up", desc: "ISL question sign for 'how'" },
  WHEN: { icon: "⏰", pose: "Right Index Circles Left Finger • Time Sign", desc: "ISL question sign for 'when'" },
  WHO: { icon: "👤", pose: "Index Finger Circling Inquiringly Near Chin", desc: "ISL question sign for 'who'" },
  WHICH: { icon: "⚖️", pose: "Both Thumbs-Up Hands Alternating Up & Down", desc: "ISL question sign for 'which'" },
  WHY: { icon: "🤔", pose: "Hand from Temple Drawing Inquiringly", desc: "ISL question sign for 'why'" },
  OK: { icon: "👌", pose: "Thumb & Index Form Circle • 3 Fingers Raised", desc: "Universal ISL sign for 'OK / fine'" },
  GOOD: { icon: "👍", pose: "Crisp Thumbs-Up Lifted Affirmatively", desc: "Sign for 'good / great / nice'" },
  NAME: { icon: "🏷️", pose: "Index & Middle Fingers Tapping Forward", desc: "ISL sign for 'name'" },
  UNDERSTAND: { icon: "💡", pose: "Index Finger Near Forehead Flicking Open", desc: "ISL sign for 'understand / know'" },
  YES: { icon: "✊", pose: "Clenched Fist Nodding Up and Down", desc: "ISL sign for 'yes'" },
  NO: { icon: "🤏", pose: "Index, Middle & Thumb Snapping Closed", desc: "ISL sign for 'no'" },
  SORRY: { icon: "✊", pose: "Right Fist Circular Rub on Chest", desc: "Apology / regret sign" },
  FINGERSPELL: { icon: "🔤", pose: "ISL Fingerspelling Hand Shape", desc: "Fingerspelling letter shapes in signing space" },
};

// Aliases mapping common words or synonyms to primary gesture configs
const RESOLVED_ALIASES = {
  OKAY: 'OK',
  FINE: 'OK',
  ALRIGHT: 'OK',
  ALL_RIGHT: 'OK',
  ALL_GOOD: 'OK',
  THEEK: 'OK',
  THIK: 'OK',
  SAHI: 'OK',
  NICE: 'GOOD',
  GREAT: 'GOOD',
  ACHHA: 'GOOD',
  ACHHI: 'GOOD',
  ACCHE: 'GOOD',
  HI: 'HELLO',
  HEY: 'HELLO',
  BYE: 'HELLO',
  GOODBYE: 'HELLO',
  ALVIDA: 'HELLO',
  SURE: 'YES',
  HAAN: 'YES',
  HA: 'YES',
  HAA: 'YES',
  CORRECT: 'YES',
  RIGHT: 'YES',
  WRONG: 'NO',
  NAHI: 'NO',
  NA: 'NO',
  BAD: 'NO',
  NAAM: 'NAME',
  KNOW: 'UNDERSTAND',
  SHUKRIYA: 'THANK_YOU',
  THANKS: 'THANK_YOU',
  DHANYAVAD: 'THANK_YOU',
  MADAD: 'HELP',
  RUKO: 'WAIT',
  BEST: 'GOOD',
  BETTER: 'GOOD',
  EXPERIENCE: 'GOOD',
  FEEL: 'UNDERSTAND',
  WANT: 'SUBMIT',
  NEED: 'SUBMIT',
  TELL: 'SHOW',
  SAY: 'SHOW',
  SEE: 'HELLO',
  LOOK: 'SHOW',
  CHECK: 'SUBMIT',
  READ: 'LIBRARY',
  STUDY: 'OFFICE',
  LEARN: 'OFFICE',
  WORK: 'OFFICE',
  MY: 'YOUR',
  MINE: 'YOUR',
  OUR: 'WELCOME',
  TOMORROW: 'FLOOR',
  YESTERDAY: 'FLOOR',
  EVERYTHING: 'OK',
  ALL: 'OK',
  WAY: 'WHERE',
  NAMASTE: 'HELLO',
  NAMASKAR: 'HELLO',
  KRIPYA: 'PLEASE',
  FEES: 'PAY',
  FEE: 'PAY',
  YOU: 'YOUR',
  KAISE: 'HOW',
  KAISA: 'HOW',
  KAISI: 'HOW',
  KAB: 'WHEN',
  KAUN: 'WHO',
  KYA: 'WHAT',
  KYUN: 'WHY',
  KYU: 'WHY',
  KAUNSA: 'WHICH',
  KAUN_SA: 'WHICH',
  KAHAN: 'WHERE',
  KIDHAR: 'WHERE',
  GROUND_FLOOR: 'FLOOR',
  CAMPUS: 'OFFICE',
  COLLEGE: 'OFFICE',
  UNIVERSITY: 'OFFICE',
  ROOM: 'OFFICE',
  BUILDING: 'OFFICE',
  CLASS: 'OFFICE',
  CLASSROOM: 'OFFICE',
  LAB: 'OFFICE',
  DEPARTMENT: 'OFFICE',
  FORM: 'SUBMIT',
  APPLICATION: 'SUBMIT',
  DOCUMENT: 'SUBMIT',
  DOCUMENTS: 'SUBMIT',
  CERTIFICATE: 'SUBMIT',
  GIVE: 'SUBMIT',
  SHOW: 'SUBMIT',
  TAKE: 'BRING',
  COLLECT: 'BRING',
  COME: 'BRING',
  GO: 'YOUR',
  WAIT: 'PLEASE',
  STOP: 'FLOOR',
  FILL: 'SUBMIT',
  APPLY: 'SUBMIT',
  DEPOSIT: 'SUBMIT',
  CASH: 'PAY',
  ONLINE: 'PAY',
  UPI: 'PAY',
  MONEY: 'PAY',
  AMOUNT: 'PAY',
  FINE: 'PAY',
  PENALTY: 'PAY',
  RECEIPT: 'SUBMIT',
  FEE_RECEIPT: 'SUBMIT',
  SLIP: 'SUBMIT',
  CHALLAN: 'SUBMIT',
  BILL: 'SUBMIT',
  INVOICE: 'SUBMIT',
  PHOTO: 'ID_CARD',
  PHOTOGRAPH: 'ID_CARD',
  SIGNATURE: 'SUBMIT',
  SIGN: 'SUBMIT',
  COPY: 'SUBMIT',
  PHOTOCOPY: 'SUBMIT',
  XEROX: 'SUBMIT',
  AADHAAR: 'ID_CARD',
  PASSPORT: 'ID_CARD',
  BADGE: 'ID_CARD',
  PASS: 'ID_CARD',
  RECORD: 'SUBMIT',
  SEAT: 'ADMISSION',
  REGISTRATION: 'ADMISSION',
  ENROLLMENT: 'ADMISSION',
  COUNSELING: 'ADMISSION',
  APPLICATION_FORM: 'SUBMIT',
  ADMISSION_FORM: 'SUBMIT',
  PAPERS: 'SUBMIT',
  FILE: 'SUBMIT',
  DEGREE: 'SUBMIT',
  DIPLOMA: 'SUBMIT',
  EXAM: 'SUBMIT',
  EXAMINATION: 'SUBMIT',
  TEST: 'SUBMIT',
  RESULT: 'SUBMIT',
  MARKS: 'SUBMIT',
  MARKSHEET: 'SUBMIT',
  GRADE: 'GOOD',
  ATTENDANCE: 'SUBMIT',
  TIMETABLE: 'SUBMIT',
  SCHEDULE: 'SUBMIT',
  SYLLABUS: 'LIBRARY',
  COURSE: 'OFFICE',
  SUBJECT: 'OFFICE',
  CANTEEN: 'OFFICE',
  CAFETERIA: 'OFFICE',
  MESS: 'OFFICE',
  HOSTEL: 'OFFICE',
  GROUND: 'FLOOR',
  GYM: 'OFFICE',
  PARKING: 'FLOOR',
  RECEPTION: 'OFFICE',
  MAIN_GATE: 'OFFICE',
  GATE: 'OFFICE',
  ENTRANCE: 'OFFICE',
  EXIT: 'OFFICE',
  DOOR: 'OFFICE',
  WINDOW: 'OFFICE',
  STAIRS: 'FLOOR',
  ELEVATOR: 'FLOOR',
  LIFT: 'FLOOR',
  WASHROOM: 'OFFICE',
  TOILET: 'OFFICE',
  RESTROOM: 'OFFICE',
  ADMINISTRATION: 'OFFICE',
  ADMIN: 'OFFICE',
  ACCOUNTS: 'OFFICE',
  ACCOUNT_OFFICE: 'OFFICE',
  EXAM_CELL: 'OFFICE',
  PLACEMENT: 'OFFICE',
  COMPUTER_SCIENCE: 'OFFICE',
  IT: 'OFFICE',
  MECHANICAL: 'OFFICE',
  CIVIL: 'OFFICE',
  ELECTRICAL: 'OFFICE',
  ELECTRONICS: 'OFFICE',
  MANAGEMENT: 'OFFICE',
  COMMERCE: 'OFFICE',
  ARTS: 'OFFICE',
  SCIENCE: 'OFFICE',
  ENGINEERING: 'OFFICE',
  AUDITORIUM: 'OFFICE',
  HALL: 'OFFICE',
  WORKSHOP: 'OFFICE',
  FIRST_FLOOR: 'FIRST',
  SECOND_FLOOR: 'SECOND',
  THIRD_FLOOR: 'THIRD',
  FOURTH_FLOOR: 'FOURTH',
  FIFTH_FLOOR: 'FOURTH',
  FIFTH: 'FOURTH',
  BASEMENT: 'FLOOR',
  LEFT: 'WHERE',
  RIGHT_DIR: 'WHERE',
  STRAIGHT: 'YOUR',
  FRONT: 'YOUR',
  BEHIND: 'YOUR',
  BACK: 'YOUR',
  NEAR: 'WELCOME',
  FAR: 'YOUR',
  HERE: 'YOUR',
  THERE: 'YOUR',
  INSIDE: 'OFFICE',
  OUTSIDE: 'OFFICE',
  UP: 'FIRST',
  DOWN: 'FLOOR',
  DIRECTION: 'WHERE',
  ROUTE: 'YOUR',
  TIME: 'WHEN',
  CLOCK: 'WHEN',
  HOUR: 'WHEN',
  MINUTE: 'WHEN',
  SECOND_TIME: 'WHEN',
  TODAY: 'FLOOR',
  NOW: 'FLOOR',
  SOON: 'FLOOR',
  LATER: 'FLOOR',
  BEFORE: 'FIRST',
  AFTER: 'SECOND',
  EARLY: 'FIRST',
  LATE: 'FLOOR',
  DAY: 'FLOOR',
  NIGHT: 'FLOOR',
  MORNING: 'HELLO',
  AFTERNOON: 'HELLO',
  EVENING: 'HELLO',
  WEEK: 'FLOOR',
  MONTH: 'FLOOR',
  YEAR: 'FLOOR',
  MONDAY: 'FIRST',
  TUESDAY: 'SECOND',
  WEDNESDAY: 'THIRD',
  THURSDAY: 'FOURTH',
  FRIDAY: 'GOOD',
  SATURDAY: 'GOOD',
  SUNDAY: 'GOOD',
  MANY: 'GOOD',
  MUCH: 'GOOD',
  SOME: 'OK',
  FEW: 'OK',
  LITTLE: 'OK',
  MORE: 'GOOD',
  LESS: 'OK',
  ENOUGH: 'OK',
  FULL: 'OK',
  EMPTY: 'NO',
  NEW: 'GOOD',
  OLD: 'OFFICE',
  IMPORTANT: 'GOOD',
  EASY: 'GOOD',
  DIFFICULT: 'WHAT',
  ZERO: 'SPELL_O',
  ONE: 'FIRST',
  TWO: 'SECOND',
  THREE: 'THIRD',
  FOUR: 'FOURTH',
  FIVE: 'WELCOME',
  SIX: 'SECOND',
  SEVEN: 'THIRD',
  EIGHT: 'FOURTH',
  NINE: 'OK',
  TEN: 'FOURTH',
  '0': 'SPELL_O',
  '1': 'FIRST',
  '2': 'SECOND',
  '3': 'THIRD',
  '4': 'FOURTH',
  '5': 'WELCOME',
  '6': 'SECOND',
  '7': 'THIRD',
  '8': 'FOURTH',
  '9': 'OK',
  STUDENT: 'YOUR',
  TEACHER: 'HELLO',
  PROFESSOR: 'HELLO',
  FACULTY: 'HELLO',
  INSTRUCTOR: 'HELLO',
  STAFF: 'OFFICE',
  OFFICER: 'OFFICE',
  CLERK: 'OFFICE',
  PRINCIPAL: 'OFFICE',
  DIRECTOR: 'OFFICE',
  DEAN: 'OFFICE',
  HOD: 'OFFICE',
  HEAD: 'OFFICE',
  GUARD: 'OFFICE',
  SECURITY: 'OFFICE',
  FRIEND: 'WELCOME',
  PARENTS: 'WELCOME',
  MOTHER: 'WELCOME',
  FATHER: 'WELCOME',
  BROTHER: 'WELCOME',
  SISTER: 'WELCOME',
  BOY: 'YOUR',
  GIRL: 'YOUR',
  PERSON: 'YOUR',
  PEOPLE: 'WELCOME',
  EVERYONE: 'WELCOME',
  SOMEONE: 'YOUR',
  NOBODY: 'NO',
  WHOSE: 'WHO',
  WHOM: 'WHO',
  HOW_MUCH: 'PAY',
  HOW_MANY: 'PAY',
  HE: 'YOUR',
  HIM: 'YOUR',
  HIS: 'YOUR',
  SHE: 'YOUR',
  HER: 'YOUR',
  HERS: 'YOUR',
  THEY: 'WELCOME',
  THEM: 'WELCOME',
  THEIR: 'WELCOME',
  THEIRS: 'WELCOME',
  THIS: 'YOUR',
  THAT: 'YOUR',
  THESE: 'YOUR',
  THOSE: 'YOUR',
  START: 'COME',
  BEGIN: 'COME',
  FINISH: 'OK',
  COMPLETE: 'OK',
  DONE: 'OK',
  OPEN: 'WELCOME',
  CLOSE: 'OFFICE',
  SEARCH: 'WHERE',
  FIND: 'WHERE',
  CALL: 'HELLO',
  SEND: 'SUBMIT',
  RECEIVE: 'BRING',
  ASSIST: 'HELP',
  SUPPORT: 'HELP',
  PARDON: 'SORRY',
  EXCUSE_ME: 'PLEASE',
  SEE_YOU: 'MEET',
  GOOD_MORNING: 'HELLO',
  GOOD_AFTERNOON: 'HELLO',
  GOOD_EVENING: 'HELLO',
  GOOD_NIGHT: 'HELLO',
  EXCELLENT: 'GOOD',
  PERFECT: 'GOOD',
  SUPER: 'GOOD',
  AWESOME: 'GOOD',
  WORSE: 'NO',
  WORST: 'NO',
  TRUE: 'YES',
  FALSE: 'NO',
  AGREE: 'YES',
  DISAGREE: 'NO',
  NO_PROBLEM: 'OK',
};

// Gesture Positional Configurations:
// Rotations [x, y, z] for whole hand orientation, offsets [x, y, z],
// finger curls [thumb, index, middle, ring, pinky], spread, and twoHanded flag.
const GESTURE_CONFIGS = {
  REST: {
    handRot: [0.15, 0, 0],
    curls: [0.20, 0.22, 0.22, 0.22, 0.22],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  PLEASE: {
    handRot: [0.25, 0.15, -0.1],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0], // flat open palm
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      // Smooth circular rubbing motion at chest level
      handPos: [0.0 + Math.sin(t * 4.5) * 0.05, 0.10 + Math.cos(t * 4.5) * 0.05, 0],
    }),
  },
  YOUR: {
    // Single dominant flat open hand pushed forward directly toward the user
    handRot: [0.15, 0, 0], // Palm directly facing camera / user
    curls: [0.15, 0.0, 0.0, 0.0, 0.0], // Flat straight fingers
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => {
      const push = (Math.sin(t * 3.5) + 1) / 2;
      return {
        handPos: [0.0, 0.10, -0.05 + push * 0.20],
      };
    },
  },
  FIRST: {
    // Index finger pointed straight UP, thumb folded over closed fist
    handRot: [0.10, 0, 0],
    curls: [0.95, 0.0, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handPos: [0.0, 0.10 + Math.sin(t * 3.5) * 0.025, 0],
    }),
  },
  SECOND: {
    // Index & Middle fingers extended in crisp 'V', thumb folded over others
    handRot: [0.10, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.98, 0.98],
    spread: [-0.28, 0.28, 0, 0], // Wide 'V' spread
    twoHanded: false,
    dynamic: (t) => ({
      handPos: [0.0, 0.10 + Math.sin(t * 3.5) * 0.025, 0],
    }),
  },
  THIRD: {
    // Index, Middle, Ring fingers raised
    handRot: [0.10, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.0, 0.98],
    spread: [-0.24, 0, 0.24, 0],
    twoHanded: false,
  },
  FOURTH: {
    // Four fingers raised, thumb folded
    handRot: [0.10, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.0, 0.0],
    spread: [-0.22, -0.07, 0.07, 0.22],
    twoHanded: false,
  },
  ID_CARD: {
    // BOTH hands active, spaced apart, index fingers extended tracing the rectangular badge
    handRot: [0.25, 0, 0],
    curls: [0.95, 0.0, 0.98, 0.98, 0.98], // Index fingers extended, others in fist
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => {
      // 4-phase perimeter trace: top horizontal -> right/left sides down -> bottom inward -> top
      const phase = (t * 2.5) % 4;
      let dx = 0;
      let dy = 0;
      if (phase < 1) {
        // Top outward sweep
        dx = phase * 0.08;
        dy = 0.04;
      } else if (phase < 2) {
        // Side vertical trace downwards
        dx = 0.08;
        dy = 0.04 - (phase - 1) * 0.08;
      } else if (phase < 3) {
        // Bottom horizontal sweep inward
        dx = 0.08 - (phase - 2) * 0.08;
        dy = -0.04;
      } else {
        // Trace back upward to start
        dx = 0;
        dy = -0.04 + (phase - 3) * 0.08;
      }
      return {
        rightHandPos: [0.24 + dx, 0.10 + dy, 0.05],
        leftHandPos: [-0.24 - dx, 0.10 + dy, 0.05],
        rightHandRot: [0.25, 0, 0],
        leftHandRot: [0.25, 0, 0],
      };
    },
  },
  BRING: {
    // BOTH hands active, spaced apart, palms facing UPWARD (supinated) and cupping inward
    rightHandRot: [1.25, Math.PI - 0.15, -0.10],
    leftHandRot: [1.25, -Math.PI + 0.15, 0.10],
    curls: [0.25, 0.35, 0.35, 0.35, 0.35],
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => {
      const pull = (Math.sin(t * 3.5) + 1) / 2; // 0 (extended) to 1 (drawn inward to body)
      return {
        rightHandRot: [1.25 + pull * 0.10, Math.PI - 0.15, -0.10],
        leftHandRot: [1.25 + pull * 0.10, -Math.PI + 0.15, 0.10],
        rightHandPos: [0.26, 0.08 + pull * 0.03, 0.22 - pull * 0.20],
        leftHandPos: [-0.26, 0.08 + pull * 0.03, 0.22 - pull * 0.20],
        curls: [
          0.20 + pull * 0.30,
          0.20 + pull * 0.45,
          0.20 + pull * 0.45,
          0.20 + pull * 0.45,
          0.20 + pull * 0.45,
        ],
      };
    },
  },
  WHERE: {
    // BOTH hands active, palms facing UPWARD, shrugging side-to-side inquiringly
    rightHandRot: [1.25, Math.PI - 0.20, -0.15],
    leftHandRot: [1.25, -Math.PI + 0.20, 0.15],
    curls: [0.15, 0.12, 0.12, 0.12, 0.12],
    spread: [-0.10, -0.04, 0.04, 0.10],
    twoHanded: true,
    dynamic: (t) => {
      const shrug = Math.sin(t * 4.5) * 0.04;
      return {
        rightHandPos: [0.26 + shrug, 0.08, 0.12],
        leftHandPos: [-0.26 - shrug, 0.08, 0.12],
        rightHandRot: [1.25, Math.PI - 0.20 - shrug * 1.5, -0.15],
        leftHandRot: [1.25, -Math.PI + 0.20 + shrug * 1.5, 0.15],
      };
    },
  },
  WHAT: {
    // Single dominant index finger wagging side to side
    handRot: [0.20, 0, 0],
    curls: [0.95, 0.0, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handRot: [0.20, 0, Math.sin(t * 7) * 0.35],
      handPos: [0.0, 0.10, 0],
    }),
  },
  PAY: {
    // Thumb and index finger rubbing tips simulating money / fee exchange
    handRot: [0.20, 0.20, 0.10],
    curls: [0.45, 0.45, 0.95, 0.95, 0.95],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handRot: [0.20, 0.20 + Math.sin(t * 8) * 0.10, 0.10],
      curls: [
        0.35 + Math.sin(t * 9) * 0.18,
        0.35 + Math.cos(t * 9) * 0.18,
        0.95,
        0.95,
        0.95,
      ],
    }),
  },
  SUBMIT: {
    // Both hands holding and presenting paperwork forward
    handRot: [0.40, 0, 0],
    curls: [0.30, 0.20, 0.20, 0.20, 0.20],
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => {
      const forward = (Math.sin(t * 3.5) + 1) / 2;
      return {
        rightHandPos: [0.26, 0.10 - forward * 0.04, forward * 0.20],
        leftHandPos: [-0.26, 0.10 - forward * 0.04, forward * 0.20],
      };
    },
  },
  HELLO: {
    // Outward waving salute
    handRot: [-0.10, 0.20, 0.10],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handRot: [-0.10, 0.20, 0.10 + Math.sin(t * 6) * 0.28],
      handPos: [0.0, 0.12, 0],
    }),
  },
  THANK_YOU: {
    // Hand sweeping forward from chin
    handRot: [0.10, 0, 0],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => {
      const sweep = (Math.sin(t * 3) + 1) / 2;
      return {
        handPos: [0.0, 0.14 - sweep * 0.04, -0.05 + sweep * 0.22],
        handRot: [0.20 - sweep * 0.35, 0, 0],
      };
    },
  },
  WELCOME: {
    // Both palms facing UPWARDS, sweeping gently inward toward body
    rightHandRot: [1.25, Math.PI - 0.30, -0.20],
    leftHandRot: [1.25, -Math.PI + 0.30, 0.20],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => {
      const sweep = (Math.sin(t * 3) + 1) / 2;
      return {
        rightHandPos: [0.30 - sweep * 0.06, 0.08, 0.16 - sweep * 0.08],
        leftHandPos: [-0.30 + sweep * 0.06, 0.08, 0.16 - sweep * 0.08],
      };
    },
  },
  FLOOR: {
    // Both flat palms facing down sweeping horizontally outward
    handRot: [1.45, 0, 0],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => {
      const sweep = Math.sin(t * 3.5) * 0.06;
      return {
        rightHandPos: [0.26 + sweep, 0.08, 0],
        leftHandPos: [-0.26 - sweep, 0.08, 0],
      };
    },
  },
  LIBRARY: {
    // Both hands open like pages of an open book, palms facing UPWARDS and tilted inward at 45°
    rightHandRot: [1.15, Math.PI - 0.45, -0.35],
    leftHandRot: [1.15, -Math.PI + 0.45, 0.35],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => ({
      rightHandPos: [0.22, 0.08, 0.12 + Math.sin(t * 5) * 0.03],
      leftHandPos: [-0.22, 0.08, 0.12],
    }),
  },
  ADMISSION: {
    // Left hand flat with palm facing UPWARDS; right hand slides forward onto it like an entry pass
    rightHandRot: [0.40, 0.20, 0],
    leftHandRot: [1.35, -Math.PI, 0],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => {
      const slide = (Math.sin(t * 4) + 1) / 2;
      return {
        rightHandPos: [0.16, 0.08 + slide * 0.08, 0.05 + slide * 0.12],
        leftHandPos: [-0.16, 0.06, 0.14],
      };
    },
  },
  OFFICE: {
    // Both hands form 90° corner walls
    rightHandRot: [0.10, -0.90, 0],
    leftHandRot: [0.10, 0.90, 0],
    curls: [0.15, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: true,
  },
  HELP: {
    // Left palm flat facing UPWARDS; right thumbs-up fist lifts upward from it
    rightHandRot: [0.10, 0, 0],
    leftHandRot: [1.35, -Math.PI, 0],
    curls: [0.0, 0.95, 0.95, 0.95, 0.95],
    spread: [0, 0, 0, 0],
    twoHanded: true,
    dynamic: (t) => {
      const lift = (Math.sin(t * 3.5) + 1) / 2;
      return {
        rightHandPos: [0.06, 0.12 + lift * 0.08, 0.05],
        leftHandPos: [-0.08, 0.06 + lift * 0.08, 0.14],
      };
    },
  },
  HOW: {
    // Authentic ISL (ISLRTC standard / Hindi "कैसे" Kaise):
    // Both hands start at chest level with loose curved fingers and palms facing inward/downward,
    // then roll/twist outward simultaneously in an arc so that BOTH OPEN PALMS FINISH FACING UPWARDS (supinated) toward the sky.
    twoHanded: true,
    spread: [0, 0, 0, 0],
    dynamic: (t) => {
      const roll = (Math.sin(t * 3.5) + 1) / 2; // 0 (start: palms down) to 1 (finish: palms UP)
      return {
        rightHandRot: [1.45 - roll * 0.20, roll * (Math.PI - 0.20), -roll * 0.15],
        leftHandRot:  [1.45 - roll * 0.20, -roll * (Math.PI - 0.20), roll * 0.15],
        rightHandPos: [0.24 + roll * 0.03, 0.08 + roll * 0.02, 0.10 + roll * 0.06],
        leftHandPos:  [-0.24 - roll * 0.03, 0.08 + roll * 0.02, 0.10 + roll * 0.06],
        curls: [
          0.20 - roll * 0.05,
          0.18 - roll * 0.06,
          0.18 - roll * 0.06,
          0.18 - roll * 0.06,
          0.18 - roll * 0.06,
        ],
      };
    },
  },
  WHEN: {
    // ISL sign for "WHEN" (Time concept):
    // Left hand index finger upright; dominant right index circles around it like clock hands
    twoHanded: true,
    curls: [0.95, 0.0, 0.98, 0.98, 0.98], // Index fingers extended
    spread: [0, 0, 0, 0],
    dynamic: (t) => {
      const angle = t * 4;
      const circleX = Math.cos(angle) * 0.05;
      const circleY = Math.sin(angle) * 0.05;
      return {
        leftHandPos: [-0.08, 0.08, 0.10],
        leftHandRot: [0.20, 0.20, 0],
        rightHandPos: [0.06 + circleX, 0.12 + circleY, 0.12],
        rightHandRot: [0.30, -0.20, 0],
      };
    },
  },
  WHO: {
    // ISL sign for "WHO": Dominant index finger circling inquiringly near chin
    handRot: [0.20, 0, 0],
    curls: [0.95, 0.0, 0.98, 0.98, 0.98], // Index finger pointing up
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handPos: [0.03 + Math.cos(t * 5) * 0.02, 0.15 + Math.sin(t * 5) * 0.02, 0.05],
      handRot: [0.20, 0.10, Math.sin(t * 5) * 0.15],
    }),
  },
  WHICH: {
    // ISL sign for "WHICH": Both hands thumbs-up alternating up and down (weighing options A vs B)
    twoHanded: true,
    curls: [0.0, 0.95, 0.95, 0.95, 0.95], // Thumbs up
    spread: [0, 0, 0, 0],
    dynamic: (t) => {
      const bob = Math.sin(t * 4) * 0.05;
      return {
        rightHandPos: [0.22, 0.08 + bob, 0.10],
        leftHandPos:  [-0.22, 0.08 - bob, 0.10],
        rightHandRot: [0.15, -0.15, 0],
        leftHandRot:  [0.15, 0.15, 0],
      };
    },
  },
  WHY: {
    // ISL sign for "WHY": Dominant hand near temple pulling outward while wagging fingers inquiringly
    twoHanded: false,
    curls: [0.4, 0.2, 0.2, 0.8, 0.8],
    spread: [0, 0, 0, 0],
    dynamic: (t) => {
      const wag = (Math.sin(t * 5) + 1) / 2;
      return {
        handPos: [0.06, 0.18 - wag * 0.04, 0.04 + wag * 0.10],
        handRot: [0.30 - wag * 0.20, 0.20, wag * 0.20],
        curls: [0.4, 0.1 + wag * 0.4, 0.1 + wag * 0.4, 0.95, 0.95],
      };
    },
  },
  OK: {
    // Universal & ISL sign for "OK":
    // Thumb and index fingertips touch forming an "O" circle, other 3 fingers extended upward
    handRot: [0.15, 0.15, 0.0],
    curls: [0.45, 0.55, 0.0, 0.0, 0.0],
    spread: [-0.08, 0.0, 0.12, 0.22],
    twoHanded: false,
    dynamic: (t) => ({
      handRot: [0.15 + Math.sin(t * 6) * 0.15, 0.15, 0.0],
      handPos: [0.0, 0.12, 0.05],
    }),
  },
  GOOD: {
    // Thumbs-up moving affirmatively forward & upward
    handRot: [0.15, 0, 0],
    curls: [0.0, 0.95, 0.95, 0.95, 0.95], // Thumb up, others in fist
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => {
      const lift = (Math.sin(t * 4) + 1) / 2;
      return {
        handPos: [0.0, 0.10 + lift * 0.06, 0.04 + lift * 0.04],
        handRot: [0.15 - lift * 0.10, 0, 0],
      };
    },
  },
  NAME: {
    // Index and middle fingers extended (H-shape), tapping affirmatively
    handRot: [0.20, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.95, 0.95],
    spread: [-0.05, 0.05, 0, 0],
    twoHanded: false,
    dynamic: (t) => {
      const tap = Math.sin(t * 7) * 0.04;
      return {
        handPos: [0.0, 0.12 + tap, 0.05],
        handRot: [0.20 + tap * 1.5, 0, 0],
      };
    },
  },
  UNDERSTAND: {
    // Hand near temple flicking open (comprehension / insight)
    handRot: [0.20, 0.15, 0],
    curls: [0.8, 0.8, 0.95, 0.95, 0.95],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => {
      const flick = (Math.sin(t * 4.5) + 1) / 2;
      return {
        handPos: [0.04, 0.16 + flick * 0.04, 0.05],
        curls: [0.8 - flick * 0.7, 0.8 - flick * 0.8, 0.95, 0.95, 0.95],
      };
    },
  },
  YES: {
    handRot: [0.10, 0, 0],
    curls: [0.95, 0.98, 0.98, 0.98, 0.98], // Fist
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handRot: [0.10 + Math.sin(t * 6) * 0.25, 0, 0], // Nodding fist
      handPos: [0.0, 0.12, 0.05],
    }),
  },
  NO: {
    handRot: [0.20, 0, 0],
    curls: [0.5, 0.5, 0.5, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => {
      const snap = (Math.sin(t * 6) + 1) / 2;
      return {
        curls: [0.2 + snap * 0.6, 0.1 + snap * 0.7, 0.1 + snap * 0.7, 0.98, 0.98],
        handPos: [0.0, 0.12, 0.05],
      };
    },
  },
  SORRY: {
    handRot: [0.25, 0.15, -0.10],
    curls: [0.95, 0.98, 0.98, 0.98, 0.98], // Fist
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handPos: [0.0 + Math.sin(t * 4.5) * 0.04, 0.10 + Math.cos(t * 4.5) * 0.04, 0],
    }),
  },
  SPELL_A: {
    handRot: [0.15, 0, 0],
    curls: [0.15, 0.98, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_B: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.0, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_C: {
    handRot: [0.10, 0.40, 0],
    curls: [0.45, 0.45, 0.45, 0.45, 0.45],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_D: {
    handRot: [0.15, 0, 0],
    curls: [0.65, 0.0, 0.85, 0.85, 0.85],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_E: {
    handRot: [0.20, 0, 0],
    curls: [0.90, 0.85, 0.85, 0.85, 0.85],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_F: {
    handRot: [0.15, 0.10, 0],
    curls: [0.45, 0.55, 0.0, 0.0, 0.0],
    spread: [-0.05, 0.0, 0.12, 0.22],
    twoHanded: false,
  },
  SPELL_G: {
    handRot: [0.10, 0.80, 0.20],
    curls: [0.15, 0.0, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_H: {
    handRot: [0.10, 0.80, 0.20],
    curls: [0.95, 0.0, 0.0, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_I: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.98, 0.98, 0.98, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_J: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.98, 0.98, 0.98, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => ({
      handRot: [0.15, 0, Math.sin(t * 5) * 0.3],
      handPos: [Math.sin(t * 5) * 0.03, 0.10 - Math.cos(t * 5) * 0.03, 0],
    }),
  },
  SPELL_K: {
    handRot: [0.15, 0, 0],
    curls: [0.30, 0.0, 0.40, 0.98, 0.98],
    spread: [-0.10, 0.10, 0, 0],
    twoHanded: false,
  },
  SPELL_L: {
    handRot: [0.15, 0, 0],
    curls: [0.0, 0.0, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_M: {
    handRot: [0.25, 0, 0],
    curls: [0.95, 0.75, 0.75, 0.75, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_N: {
    handRot: [0.25, 0, 0],
    curls: [0.95, 0.75, 0.75, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_O: {
    handRot: [0.15, 0.35, 0],
    curls: [0.65, 0.65, 0.65, 0.65, 0.65],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_P: {
    handRot: [1.35, 0.20, 0],
    curls: [0.30, 0.0, 0.40, 0.98, 0.98],
    spread: [-0.10, 0.10, 0, 0],
    twoHanded: false,
  },
  SPELL_Q: {
    handRot: [1.35, 0.40, 0],
    curls: [0.15, 0.0, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_R: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.98, 0.98],
    spread: [-0.10, -0.10, 0, 0],
    twoHanded: false,
  },
  SPELL_S: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.98, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_T: {
    handRot: [0.20, 0, 0],
    curls: [0.80, 0.75, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_U: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_V: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.98, 0.98],
    spread: [-0.26, 0.26, 0, 0],
    twoHanded: false,
  },
  SPELL_W: {
    handRot: [0.15, 0, 0],
    curls: [0.95, 0.0, 0.0, 0.0, 0.98],
    spread: [-0.22, 0.0, 0.22, 0],
    twoHanded: false,
  },
  SPELL_X: {
    handRot: [0.20, 0, 0],
    curls: [0.95, 0.50, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_Y: {
    handRot: [0.15, 0, 0],
    curls: [0.0, 0.98, 0.98, 0.98, 0.0],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
  SPELL_Z: {
    handRot: [0.20, 0, 0],
    curls: [0.95, 0.0, 0.98, 0.98, 0.98],
    spread: [0, 0, 0, 0],
    twoHanded: false,
    dynamic: (t) => {
      const phase = (t * 4) % 3;
      let dx = 0, dy = 0;
      if (phase < 1) { dx = phase * 0.06; dy = 0.03; }
      else if (phase < 2) { dx = 0.06 - (phase - 1) * 0.06; dy = 0.03 - (phase - 1) * 0.06; }
      else { dx = (phase - 2) * 0.06; dy = -0.03; }
      return { handPos: [dx, 0.10 + dy, 0] };
    },
  },
  FINGERSPELL: {
    handRot: [0.10, 0, 0],
    curls: [0.20, 0.0, 0.10, 0.20, 0.30],
    spread: [0, 0, 0, 0],
    twoHanded: false,
  },
};

function Avatar3D({ activeToken, isPlaying, playbackSpeed = 1.0, isTheaterMode = false, onToggleTheater }) {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const handRigRef = useRef(null);
  const activeTokenRef = useRef(activeToken);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(playbackSpeed);

  const [isAnatomicalModelActive, setIsAnatomicalModelActive] = useState(false);

  useEffect(() => {
    activeTokenRef.current = activeToken;
  }, [activeToken]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 420;

    // 1. Scene & Close-Up Camera Focused on Hands
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c161d);

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
    camera.position.set(0, 0.28, 1.40);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.20, 0);
    controls.minDistance = 0.45;
    controls.maxDistance = 2.4;
    controls.maxPolarAngle = Math.PI / 2 + 0.2;
    controlsRef.current = controls;

    // 3. Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x142833, 0.95);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(1.5, 2.5, 2.5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7adbc5, 0.65);
    fillLight.position.set(-1.5, 1.5, 1.8);
    scene.add(fillLight);

    const handSpot = new THREE.SpotLight(0xffffff, 2.5, 5, Math.PI / 3, 0.25);
    handSpot.position.set(0, 1.6, 1.8);
    handSpot.target.position.set(0, 0.20, 0);
    scene.add(handSpot);
    scene.add(handSpot.target);

    const rimLight = new THREE.DirectionalLight(0x49c4a8, 0.9);
    rimLight.position.set(0, 2.0, -2.0);
    scene.add(rimLight);

    // Floor Platform
    const floorGeo = new THREE.CircleGeometry(1.4, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1c24,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const ringGeo = new THREE.RingGeometry(1.38, 1.4, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38b293, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // 4. LOAD ANATOMICAL HAND MODEL (hands.glb)
    const handsRoot = new THREE.Group();
    scene.add(handsRoot);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/hands.glb',
      (gltf) => {
        setIsAnatomicalModelActive(true);

        const rightHandModel = gltf.scene;

        // Clone left hand model BEFORE touching any userData on rightHandModel!
        const leftHandModel = SkeletonUtils.clone(rightHandModel);

        // Realistic anatomical scale: hand height ~0.46m
        const scale = 0.020;
        rightHandModel.scale.set(scale, scale, scale);
        // Mirror across X axis using scale to produce an anatomically correct left hand
        leftHandModel.scale.set(-scale, scale, scale);

        // Realistic PBR Skin & Nails Materials with DoubleSide to prevent mirrored culling
        const skinMat = new THREE.MeshStandardMaterial({
          color: 0xe2ad94,
          roughness: 0.52,
          metalness: 0.04,
          side: THREE.DoubleSide,
          shadowSide: THREE.DoubleSide,
        });
        const nailMat = new THREE.MeshStandardMaterial({
          color: 0xf3d2c7,
          roughness: 0.25,
          metalness: 0.08,
          side: THREE.DoubleSide,
          shadowSide: THREE.DoubleSide,
        });

        const applyMaterials = (model) => {
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.name.toLowerCase().includes('nail')) {
                child.material = nailMat;
              } else {
                child.material = skinMat;
              }
            }
          });
        };

        applyMaterials(rightHandModel);
        applyMaterials(leftHandModel);

        // Helper to extract bone hierarchy & independently initialize fresh rest quaternions
        const setupBoneMap = (root) => {
          const bones = {};
          root.traverse((child) => {
            if (child.isBone) {
              bones[child.name] = child;
              child.userData.restQuat = new THREE.Quaternion().copy(child.quaternion);
            }
          });

          return {
            wrist: bones['radius_ulna'],
            index: [bones['index_prox'], bones['index_midd'], bones['index_dist']],
            midd: [bones['midd_prox'], bones['midd_midd'], bones['midd_dist']],
            ring: [bones['ring_prox'], bones['ring_midd'], bones['ring_dist']],
            pinky: [bones['pinky_prox'], bones['pinky_midd'], bones['pinky_dist']],
            thumb: [bones['thumb_trapez'], bones['thumb_meta'], bones['thumb_prox'], bones['thumb_dist']],
          };
        };

        const rightBones = setupBoneMap(rightHandModel);
        const leftBones = setupBoneMap(leftHandModel);

        // Position Right Hand Group (Dominant)
        const rightGroup = new THREE.Group();
        rightGroup.position.set(0.0, 0.10, 0);
        rightGroup.add(rightHandModel);
        handsRoot.add(rightGroup);

        // Position Left Hand Group (Non-Dominant / Dual-Hand)
        const leftGroup = new THREE.Group();
        leftGroup.position.set(-0.26, 0.10, 0);
        leftGroup.visible = false; // Initially hidden until a two-handed gesture activates
        leftGroup.add(leftHandModel);
        handsRoot.add(leftGroup);

        handRigRef.current = {
          isLoaded: true,
          right: { group: rightGroup, model: rightHandModel, bones: rightBones },
          left: { group: leftGroup, model: leftHandModel, bones: leftBones },
        };
      },
      undefined,
      (err) => {
        console.warn("Could not load hands.glb:", err);
      }
    );

    // 5. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      try {
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime() * speedRef.current;

        controls.update();

        const rig = handRigRef.current;
        if (rig && rig.isLoaded) {
          const rawToken = (activeTokenRef.current || 'REST').toUpperCase().trim();
          const cleanToken = rawToken.replace(/[^A-Z0-9_]/g, '');

          // Extract letter if this is a fingerspelling token (_SPELL_X, SPELL_X, or single char X)
          let letter = null;
          if (cleanToken.startsWith('_SPELL_')) {
            letter = cleanToken.slice(7);
          } else if (cleanToken.startsWith('SPELL_')) {
            letter = cleanToken.slice(6);
          } else if (cleanToken.length === 1 && cleanToken >= 'A' && cleanToken <= 'Z') {
            letter = cleanToken;
          }

          let resolvedKey = cleanToken;
          if (letter && GESTURE_CONFIGS[`SPELL_${letter}`]) {
            resolvedKey = `SPELL_${letter}`;
          } else if (RESOLVED_ALIASES[cleanToken]) {
            resolvedKey = RESOLVED_ALIASES[cleanToken];
          } else if (letter) {
            resolvedKey = 'FINGERSPELL';
          }

          let targetPose = GESTURE_CONFIGS[resolvedKey] || GESTURE_CONFIGS.REST;

          let dyn = null;
          if (isPlayingRef.current && targetPose.dynamic) {
            dyn = targetPose.dynamic(elapsedTime);
          }

          const lerpFactor = Math.min(1.0, delta * 9.5);
          const isTwoHanded = targetPose.twoHanded;

          // Left Hand Visibility: ONLY visible on two-handed gestures!
          // This completely prevents awkward hovering/overlapping hands during single-handed signs!
          if (rig.left) {
            rig.left.group.visible = isTwoHanded;
          }

          // Target rotations:
          const baseRightRot = dyn?.rightHandRot || dyn?.handRot || targetPose.rightHandRot || targetPose.handRot || [0, 0, 0];
          const baseLeftRot = dyn?.leftHandRot || targetPose.leftHandRot || [
            baseRightRot[0],
            -baseRightRot[1],
            -baseRightRot[2],
          ];

          // Target positions:
          // Single-handed: dominant right hand centered at X = 0.0.
          // Two-handed: comfortable shoulder-width spacing at X = +0.26 and -0.26 with clean gap
          const defaultRightPos = isTwoHanded ? [0.26, 0.10, 0.0] : [0.0, 0.10, 0.0];
          const defaultLeftPos = isTwoHanded ? [-0.26, 0.10, 0.0] : [-0.45, -0.20, -0.20];

          const rightTargetPos = dyn?.rightHandPos || dyn?.handPos || defaultRightPos;
          const leftTargetPos = dyn?.leftHandPos || defaultLeftPos;

          // Right Hand Group Transformation
          rig.right.group.position.x += (rightTargetPos[0] - rig.right.group.position.x) * lerpFactor;
          rig.right.group.position.y += (rightTargetPos[1] - rig.right.group.position.y) * lerpFactor;
          rig.right.group.position.z += (rightTargetPos[2] - rig.right.group.position.z) * lerpFactor;

          rig.right.group.rotation.x += (baseRightRot[0] - rig.right.group.rotation.x) * lerpFactor;
          rig.right.group.rotation.y += (baseRightRot[1] - rig.right.group.rotation.y) * lerpFactor;
          rig.right.group.rotation.z += (baseRightRot[2] - rig.right.group.rotation.z) * lerpFactor;

          // Left Hand Group Transformation (when active in two-handed signs)
          if (rig.left && isTwoHanded) {
            rig.left.group.position.x += (leftTargetPos[0] - rig.left.group.position.x) * lerpFactor;
            rig.left.group.position.y += (leftTargetPos[1] - rig.left.group.position.y) * lerpFactor;
            rig.left.group.position.z += (leftTargetPos[2] - rig.left.group.position.z) * lerpFactor;

            rig.left.group.rotation.x += (baseLeftRot[0] - rig.left.group.rotation.x) * lerpFactor;
            rig.left.group.rotation.y += (baseLeftRot[1] - rig.left.group.rotation.y) * lerpFactor;
            rig.left.group.rotation.z += (baseLeftRot[2] - rig.left.group.rotation.z) * lerpFactor;
          }

          // Bulletproof rest quaternion resolver (handles THREE.Quaternion, plain array, or fallback)
          const getRestQuat = (bone) => {
            if (bone.userData.restQuat && typeof bone.userData.restQuat.clone === 'function') {
              return bone.userData.restQuat;
            }
            if (Array.isArray(bone.userData.restQuat) && bone.userData.restQuat.length === 4) {
              bone.userData.restQuat = new THREE.Quaternion().fromArray(bone.userData.restQuat);
              return bone.userData.restQuat;
            }
            bone.userData.restQuat = bone.quaternion.clone();
            return bone.userData.restQuat;
          };

          // Articulate individual finger knuckles (index, middle, ring, pinky, thumb)
          const animateFingers = (bones, curls, spread) => {
            if (!bones) return;

            const fingerList = [bones.index, bones.midd, bones.ring, bones.pinky];
            const fingerCurlIndices = [1, 2, 3, 4];

            fingerList.forEach((fingerBones, fIdx) => {
              if (!fingerBones) return;
              const curl = curls[fingerCurlIndices[fIdx]] ?? 0.0;
              const spreadX = spread[fIdx] || 0.0;

              fingerBones.forEach((joint, jIdx) => {
                if (!joint) return;
                const restQ = getRestQuat(joint);
                // In hands.glb, finger flexion (curling into palm) is around local Z!
                const angleZ = curl * 1.45;
                // Lateral finger spread (abduction) is around local X!
                const angleX = jIdx === 0 ? spreadX : 0.0;

                const qOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(angleX, 0, angleZ, 'XYZ'));
                const targetQ = restQ.clone().multiply(qOffset);
                joint.quaternion.slerp(targetQ, lerpFactor);
              });
            });

            // Anatomically correct thumb opposition & folding across palm
            if (bones.thumb) {
              const thumbCurl = curls[0] ?? 0.0;
              // When curled (fist/point): opposition angles wrap thumb tightly across knuckles
              // When flat/relaxed: subtle natural adduction alongside palm
              const tAngleX = thumbCurl > 0.4 ? thumbCurl * 0.80 : thumbCurl * 0.25;
              const tAngleY = thumbCurl > 0.4 ? thumbCurl * 0.25 : 0.0;
              const tAngleZ = thumbCurl > 0.4 ? thumbCurl * 0.95 : thumbCurl * 0.35;

              bones.thumb.forEach((tJoint, tIdx) => {
                if (!tJoint) return;
                const restQ = getRestQuat(tJoint);
                const factor = tIdx === 0 ? 0.3 : (tIdx === 1 ? 0.7 : 1.0);
                const qOffset = new THREE.Quaternion().setFromEuler(
                  new THREE.Euler(tAngleX * factor, tAngleY * factor, tAngleZ * factor, 'XYZ')
                );
                const targetQ = restQ.clone().multiply(qOffset);
                tJoint.quaternion.slerp(targetQ, lerpFactor);
              });
            }
          };

          const activeRightCurls = dyn?.curls || targetPose.curls || [0, 0, 0, 0, 0];
          animateFingers(rig.right.bones, activeRightCurls, targetPose.spread);

          if (rig.left && isTwoHanded) {
            animateFingers(rig.left.bones, activeRightCurls, targetPose.spread);
          }
        }
      } catch (err) {
        console.error("Animation loop error:", err);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth;
      const newH = mount.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 0.28, 1.40);
      controlsRef.current.target.set(0, 0.20, 0);
      controlsRef.current.update();
    }
  };

  const handleZoomKnuckles = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 0.22, 0.85);
      controlsRef.current.target.set(0, 0.18, 0);
      controlsRef.current.update();
    }
  };

  const rawTokenName = (activeToken || 'REST').toUpperCase().trim();
  const tokenName = RESOLVED_ALIASES[rawTokenName] || rawTokenName;

  // Format fingerspelling token display nicely: e.g. _SPELL_R -> "LETTER R"
  const isSpellToken = tokenName.includes('SPELL');
  const spellLetter = isSpellToken ? tokenName.replace(/^_?SPELL_/, '') : null;
  const displayTokenName = spellLetter ? `LETTER ${spellLetter}` : tokenName;

  const guide = GESTURE_GUIDES[tokenName] || (spellLetter ? {
    icon: '🔤',
    pose: `Fingerspell letter '${spellLetter}' • ISL Alphabet`,
    desc: `Handshape for letter ${spellLetter} in sign language fingerspelling`,
  } : {
    icon: '🤟',
    pose: `Perform Indian Sign Language sign for '${tokenName}'`,
    desc: 'Articulated anatomical hand gesture',
  });

  return (
    <div className="avatar-3d-wrapper">
      <div ref={mountRef} className="avatar-3d-canvas-container" />

      {/* Live Handshape Guide Card directly on canvas */}
      <div className="avatar-live-cue-card">
        <div className="cue-icon">{guide.icon}</div>
        <div className="cue-details">
          <div className="cue-title">
            <span className="cue-token">{displayTokenName}</span>
            <span className="cue-badge">
              {isAnatomicalModelActive ? "✨ Dual Anatomical Hands Active" : "ISL Sign Guide"}
            </span>
          </div>
          <div className="cue-pose">{guide.pose}</div>
        </div>
      </div>

      <div className="avatar-3d-overlay-hint">
        <span className="camera-hint-badge">
          🖱️ Rotate 360° • Scroll Zoom
        </span>
        <div className="cam-buttons-group">
          {onToggleTheater && (
            <button
              type="button"
              className={`reset-cam-btn ${isTheaterMode ? 'active-theater-btn' : ''}`}
              onClick={onToggleTheater}
              title={isTheaterMode ? "Exit Fullscreen Theater (Esc)" : "Expand Window to Fit Entire Screen"}
            >
              {isTheaterMode ? "🗗 Exit Fit" : "⛶ Fit Screen"}
            </button>
          )}
          <button
            type="button"
            className="reset-cam-btn"
            onClick={handleZoomKnuckles}
            title="Super Close-Up View on Fingers & Knuckles"
          >
            🔍 Zoom Knuckles
          </button>
          <button
            type="button"
            className="reset-cam-btn"
            onClick={handleResetCamera}
            title="Default Hand View"
          >
            🎯 Reset View
          </button>
        </div>
      </div>
    </div>
  );
}

export default Avatar3D;
