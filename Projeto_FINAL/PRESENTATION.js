"use strict";

// ----- solicita recursos necessรกrios ๐๐๐

const prompt = require("prompt-sync")();
const activityList_nutrition = require("./data/activityList_nutrition.json");
const activityList_hygiene = require("./data/activityList_hygiene.json");
const activityList_toilet = require("./data/activityList_toilet.json");
const activityList_fun = require("./data/activityList_fun.json");
const activityList_social = require("./data/activityList_social.json");
const jobList = require("./data/jobList.json");
const { nutritionAnimation } = require("./ASCII_Animations/nutrition.js");
const { energyAnimation } = require("./ASCII_Animations/energy.js");
const { hygieneAnimation } = require("./ASCII_Animations/hygiene.js");
const { toiletAnimation } = require("./ASCII_Animations/toilet.js");
const { funAnimation } = require("./ASCII_Animations/fun.js");
const { socialAnimation } = require("./ASCII_Animations/social.js");
const { workAnimation } = require("./ASCII_Animations/work.js");
const { ohNoAnimation } = require("./ASCII_Animations/ohNo.js");
const { gameOverAnimation } = require("./ASCII_Animations/gameOver.js");
const { statisticsAnimation } = require("./ASCII_Animations/statistics.js");
const { formatToTitle, formatPrompt, formatClock, sleep, } = require("./lib/formatting.js");
const { validatePromptString, validatePromptIntMinMax, } = require("./lib/validation.js");
const { confirmation } = require("./lib/confirmation");

// ----- OBJECTS DEFINITION ----- ๐๐๐

// ----- PLAYER ----- ๐๐

const player = {
  name: "",
  job: {
    title: " ",
    daysToWork: [],
    periodsToWork: [],
    minHoursPerWeek: 0,
    salaryPerHour: 0,
  },
  wallet: 0,
  needs: {
    nutrition: 7,
    energy: 7,
    hygiene: 7,
    toilet: 7,
    fun: 7,
    social: 7,
  },

  // atualiza o objeto player de acordo com a profissรฃo selecionada ๐

  updatePlayerJob: function (job) {
    this.job.title = job.title;
    this.job.daysToWork = job.daysToWork;
    this.job.periodsToWork = job.periodsToWork;
    this.job.minHoursPerWeek = job.minHoursPerWeek;
    this.job.salaryPerHour = job.salaryPerHour;
  },

  // atualiza os atributos do jogador de acordo com a atividade escolhida ๐

  updateNeeds: function (chosenActivity) {
    const activityKeysList = Object.keys(chosenActivity.needsModification);

    for (let need of activityKeysList) {
      this.needs[need] += chosenActivity.needsModification[need];

      if (this.needs[need] > 10) {
        this.needs[need] = 10;
      } else if (this.needs[need] < 0) {
        this.needs[need] = 0;
      }
    }
  },
  // atualiza a carteira com os gastos da atividade

  updateWallet: function (amount) {
    this.wallet -= amount;
  },

  // atualiza os atributos de forma autรดnoma a cada troca de perรญodo ๐

  updateNeedsAutonomous: function () {
    this.needs.nutrition -= 3;
    this.needs.energy -= 2;
    this.needs.hygiene -= 3;
    this.needs.toilet -= 3;
    this.needs.fun -= 1;
    this.needs.social -= 1;
  },
};

// ----- TIME ----- ๐๐

const time = {
  days: 0,
  hours: 7,
  minutes: 0,

  // avanรงa o relรณgio ๐

  increment: function (activityMinutes) {
    let hoursToAdd = 0;
    let daysToAdd = 0;

    this.minutes += activityMinutes;

    if (this.minutes >= 60) {
      hoursToAdd = Math.floor(this.minutes / 60);
      this.hours += hoursToAdd;
      this.minutes %= 60;
    }

    if (this.hours >= 24) {
      daysToAdd = Math.floor(this.hours / 24);
      this.days += daysToAdd;
      this.hours %= 24;
    }
  },

  // retorna a hora atual no formato 00:00 ๐

  getTime: function () {
    let currentTime = formatClock(this.hours, this.minutes);
    return currentTime;
  },

  // retorna o perรญodo atual ๐

  getPeriod: function () {
    let currentPeriod;

    if (this.hours >= 4 && this.hours < 12) {
      currentPeriod = "manhรฃ";
    } else if (this.hours >= 12 && this.hours < 18) {
      currentPeriod = "tarde";
    } else if (this.hours < 4 || this.hours >= 18) {
      currentPeriod = "noite";
    }

    return currentPeriod;
  },

  // retorna o dia atual ๐

  getDay: function () {
    let currentDay;
    return this.days + 1;
  },

  // retorna o dia da semana atual ๐

  getWeekDay: function () {
    const weekDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
    return weekDays[this.days];
  },
};

// ----- CHOSEN ACTIVITY ----- ๐๐ (atividade selecionada)

let chosenActivity = {
  type: "",
  title: "",
  cost: 0,
  timeToComplete: 0,
  needsModification: {
    nutrition: 0,
    energy: 0,
    hygiene: 0,
    toilet: 0,
    fun: 0,
    social: 0,
  },
  work: {
    earnedNow: 0,
    hoursWorked: 0,
  },

  // exibe informaรงรตes da atividade selecionada ๐

  displayChosenActivityInfo: function () {
    console.clear();

    displayPlayerInfo();

    let needsModificationString = getFormattedNeedsModification(
      this.needsModification
    );

    console.log(`atividade selecionada | ${this.title}`);
    console.log();

    if (this.cost != 0) {
      console.log(`       custo: \t$${this.cost.toFixed(2)}`);
    }

    console.log(`     duraรงรฃo: \t${this.timeToComplete} minutos
    atributos: \t${needsModificationString} 
`);

    if (this.type == 0) {
      console.log(`๐ฒ +$${this.work.earnedNow}\t+${this.work.hoursWorked}h trabalhadas
      
TOTAL horas trabalhadas atรฉ agora: ${records.work.totalHours}
`);
    }
  },
};

// ----- LOW NEED ACTIVITIES ----- ๐๐ (atividades acionadas por atributo <= 0)

const lowNeedActivities = {
  nutrition: {
    title: "nutriรงรฃo",
    area: "physicalHealth",
    timeToComplete: 180,
    needsModification: {
      nutrition: 10,
    },
    message: "vocรช desmaiou por estar desnutrido.\nvocรช foi levado ao hospital para receber os cuidados necessรกrios.",
  },
  energy: {
    title: "energia",
    area: "physicalHealth",
    timeToComplete: 480,
    needsModification: {
      energy: 8,
    },
    message: "vocรช dormiu por 8 horas para recuperar a energia.",
  },
  hygiene: {
    title: "higiene",
    area: "physicalHealth",
    timeToComplete: 60,
    needsModification: {
      hygiene: 10,
      social: -3,
    },
    message: "ninguรฉm queria chegar perto de vocรช, por causa do fedรด.\nvocรช tomou um banho caprichado",
  },
  toilet: {
    title: "banheiro",
    area: "physicalHealth",
    timeToComplete: 60,
    needsModification: {
      hygiene: 8,
      toilet: 10,
      social: -3,
    },
    message: "vocรช fez xixi na calรงa e todo mundo viu. vocรช tomou um banho e lavou suas roupas.",
  },
  fun: {
    title: "diversรฃo",
    area: "mentalHealth",
    timeToComplete: 120,
    needsModification: {
      fun: 5,
    },
    message: "vocรช foi ร? emergรชncia psiquiรกtrica para uma consulta por stress.",
  },
  social: {
    title: "social",
    area: "mentalHealth",
    timeToComplete: 60,
    needsModification: {
      fun: -2,
      social: -3,
    },
    message: "vocรช se sente sozinho e abandonado entรฃo passa um tempo conversando com as plantas.",
  },

  // executa a aรงรฃo equivalente quando atributo <= 0 ๐

  triggerAction: function () {
    const needsModificationKeys = [
      "nutrition",
      "energy",
      "hygiene",
      "toilet",
      "fun",
      "social",
    ];

    for (let key of needsModificationKeys) {
      if (player.needs[key] <= 0) {
        let actionTriggered = this[key];

        time.increment(actionTriggered.timeToComplete);
        player.updateNeeds(actionTriggered);
        records.lowNeedActivities[key]["totalTimes"]++;
        records.lowNeedActivities[key]["totalMinutes"] += actionTriggered.timeToComplete;

        if (actionTriggered.area == "physicalHealth") {
          records.lowNeedAreas.physicalHealth++;
        } else {
          records.lowNeedAreas.mentalHealth++;
        }

        const actionTriggeredTitle = formatToTitle(`${actionTriggered.title.toUpperCase()} menor ou igual a ZERO!`);

        let needsModificationString = getFormattedNeedsModification(
          actionTriggered.needsModification
        );

        console.clear();
        ohNoAnimation();
        console.log(actionTriggeredTitle);
        console.log(actionTriggered.message);
        console.log();
        console.log(needsModificationString);
        console.log(`๐ ${actionTriggered.timeToComplete} min`);
        console.log();
        formatPrompt("digite ENTER para continuar");
        console.clear();
      }
    }
  },
};

// ----- RECORDS ----- ๐๐ (estatรญsticas)

const records = {
  work: {
    totalTimes: 0,
    totalHours: 0,
    totalEarnings: 0,
  },
  energy: {
    totalTimes: 0,
    totalHours: 0,
  },
  nutrition: {
    cook: { totalTimes: 0 },
    delivery: { totalTimes: 0 },
    eatOut: { totalTimes: 0 },
    totalCost: 0,
    totalMinutes: 0,
  },
  hygiene: {
    totalTimes: 0,
    totalCost: 0,
    totalMinutes: 0,
  },
  toilet: {
    totalTimes: 0,
    totalCost: 0,
    totalMinutes: 0,
  },
  fun: {
    totalTimes: 0,
    totalCost: 0,
    totalMinutes: 0,
  },
  social: {
    totalTimes: 0,
    totalCost: 0,
    totalMinutes: 0,
  },
  lowNeedActivities: {
    nutrition: {
      totalTimes: 0,
      totalMinutes: 0,
    },
    energy: {
      totalTimes: 0,
      totalMinutes: 0,
    },
    hygiene: {
      totalTimes: 0,
      totalMinutes: 0,
    },
    toilet: {
      totalTimes: 0,
      totalMinutes: 0,
    },
    fun: {
      totalTimes: 0,
      totalMinutes: 0,
    },
    social: {
      totalTimes: 0,
      totalMinutes: 0,
    },
  },
  lowNeedAreas: {
    physicalHealth: 0,
    mentalHealth: 0,
  },
};

// SUBMENUS ๐๐๐

// ----- submenu WORK ๐๐

const submenuWork = () => {
  let weekDayToday = time.getWeekDay();
  let now = time.getPeriod();
  let confirmChoice;

  // seleciona a tarefa se dia/perรญodo de trabalho permitido ๐

  if (
    (player.job.daysToWork == "qualquer" ||
      player.job.daysToWork.includes(weekDayToday)) &&
    (player.job.periodsToWork == "qualquer" ||
      player.job.periodsToWork.includes(now))
  ) {
    // solicita a quantidade de horas a trabalhar ๐

    let hoursWorked = validatePromptIntMinMax(
      "trabalhar quantas horas?",
      4,
      1,
      "vocรช deve selecionar um NรMERO INTEIRO entre 1 e 4"
    );

    // altera o objeto chosenActivity com as opรงรตes escolhidas ๐

    const WorkActivity = {
      type: 0,
      title: `TRABALHAR ${hoursWorked}h`,
      cost: 0,
      timeToComplete: hoursWorked * 60,
      needsModification: {
        nutrition: 0,
        energy: 0,
        hygiene: 0,
        toilet: 0,
        fun: Math.ceil((hoursWorked / 2) * -1),
        social: 0,
      },
      work: {
        earnedNow: hoursWorked * player.job.salaryPerHour,
        hoursWorked: hoursWorked,
      },
    };

    Object.assign(chosenActivity, WorkActivity);

    chosenActivity.displayChosenActivityInfo();

    // dรก ao jogador a opรงรฃo de confirmar a seleรงรฃo ou voltar e escolher novamente ๐

    confirmChoice = confirmation();
  } else {
    // exibe um erro se dia/perรญodo de trabalho nรฃo permitido

    console.log(`vocรช nรฃo pode trabalhar agora!
        
seu cronograma de trabalho:

   dias: ${player.job.daysToWork}
horรกrio: ${player.job.periodsToWork}
`);

    confirmChoice = 0;

    formatPrompt("digite ENTER para voltar");
  }

  return confirmChoice;
};

// ----- submenu NUTRITION ๐๐

const submenuNutrition = () => {
  let nutritionActivityChoiceIndex;
  let chosenNutritionActivity;
  let confirmChoice;

  console.clear();

  displayPlayerInfo();

  console.log(`NUTRIรรO | selecione o que comer`);
  console.log();

  // exibe as opรงรตes de comida ๐

  for (let nutritionActivity of activityList_nutrition) {
    console.log(`[${nutritionActivity.index}] ${nutritionActivity.title.toUpperCase()}`);
  }

  console.log();

  // solicita a escolha da comida ๐

  nutritionActivityChoiceIndex = validatePromptIntMinMax(
    "sua escolha:",
    activityList_nutrition.length - 1,
    0,
    `digite um NรMERO INTEIRO entre 0 e ${activityList_nutrition.length - 1}`
  );

  chosenNutritionActivity = activityList_nutrition[nutritionActivityChoiceIndex];

  console.clear();

  // solicita a escolha entre COZINHAR, DELIVERY e RESTAURANTE ๐

  displayPlayerInfo();

  console.log(`alimento selecionado | ${chosenNutritionActivity.title.toUpperCase()}

---------------------------------------
[0]  |   COZINHAR    |  ๐๐๐   ๐ฒ    
---------------------------------------
[1]  |   DELIVERY    |   ๐๐    ๐ฒ๐ฒ   
---------------------------------------
[2]  |  RESTAURANTE  |    ๐     ๐ฒ๐ฒ๐ฒ  
---------------------------------------
`);

  let nutritionPrepMethodIndex = validatePromptIntMinMax(
    "sua escolha:",
    2,
    0,
    `digite um NรMERO INTEIRO entre 0 e 2`
  );

  // altera o objeto chosenActivity com as opรงรตes escolhidas ๐

  let nutritionActivity;

  // COZINHAR ๐

  switch (nutritionPrepMethodIndex) {
    case 0: {
      nutritionActivity = {
        type: 1,
        typeString: "cook",
        title: `COZINHAR ${chosenNutritionActivity.title.toUpperCase()}`,
        cost: chosenNutritionActivity.cost,
        timeToComplete: chosenNutritionActivity.timeToComplete * 2,
        needsModification: {
          nutrition: chosenNutritionActivity.needsModification.nutrition,
          energy: 0,
          hygiene: 0,
          toilet: chosenNutritionActivity.needsModification.toilet,
          fun: 0,
          social: 0,
        },
      };

      break;
    }

    // DELIVERY ๐

    case 1: {
      nutritionActivity = {
        type: 1,
        typeString: "delivery",
        title: `DELIVERY - ${chosenNutritionActivity.title.toUpperCase()}`,
        cost: Math.floor(chosenNutritionActivity.cost * 1.5),
        timeToComplete: Math.floor(
          chosenNutritionActivity.timeToComplete * 1.5
        ),
        needsModification: {
          nutrition: chosenNutritionActivity.needsModification.nutrition,
          energy: 0,
          hygiene: 0,
          toilet: chosenNutritionActivity.needsModification.toilet,
          fun: 0,
          social: 0,
        },
      };

      break;
    }

    // RESTAURANTE ๐

    case 2: {
      nutritionActivity = {
        type: 1,
        typeString: "eatOut",
        title: `RESTAURANTE - ${chosenNutritionActivity.title.toUpperCase()}`,
        cost: chosenNutritionActivity.cost * 2,
        timeToComplete: chosenNutritionActivity.timeToComplete,
        needsModification: {
          nutrition: chosenNutritionActivity.needsModification.nutrition,
          energy: 0,
          hygiene: 0,
          toilet: chosenNutritionActivity.needsModification.toilet,
          fun: 0,
          social: 0,
        },
      };

      break;
    }
  }

  Object.assign(chosenActivity, nutritionActivity);

  chosenActivity.displayChosenActivityInfo();

  // dรก ao jogador a opรงรฃo de confirmar a seleรงรฃo ou voltar e escolher novamente ๐

  confirmChoice = confirmation();
  return confirmChoice;
};

// submenu ENERGY ๐๐

const submenuEnergy = () => {
  {
    let confirmChoice;

    // solicita a quantidade de horas a dormir ๐

    let hoursSlept = validatePromptIntMinMax(
      "dormir quantas horas?",
      8,
      1,
      "vocรช deve selecionar um NรMERO INTEIRO entre 1 e 8"
    );

    // altera o objeto chosenActivity com as opรงรตes escolhidas ๐

    const energyActivity = {
      type: 2,
      title: `DORMIR ${hoursSlept}h`,
      cost: 0,
      timeToComplete: hoursSlept * 60,
      needsModification: {
        nutrition: 0,
        energy: hoursSlept,
        hygiene: 0,
        toilet: 0,
        fun: 0,
        social: 0,
      },
    };

    Object.assign(chosenActivity, energyActivity);

    chosenActivity.displayChosenActivityInfo();

    // dรก ao jogador a opรงรฃo de confirmar a seleรงรฃo ou voltar e escolher novamente ๐

    confirmChoice = confirmation();
    return confirmChoice;
  }
};

// submenu OTHER (hygiene, toilet, fun, social) ๐๐

const submenuOther = (chosenActivityType) => {
  let otherActivityList = [];
  let otherActivityTitle;
  let otherActivityChoiceIndex;
  let chosenOtherActivity;
  let confirmChoice;

  switch (chosenActivityType) {
    case 3:
      otherActivityList = activityList_hygiene;
      otherActivityTitle = "HIGIENE";
      break;
    case 4:
      otherActivityList = activityList_toilet;
      otherActivityTitle = "BANHEIRO";
      break;
    case 5:
      otherActivityList = activityList_fun;
      otherActivityTitle = "DIVERSรO";
      break;
    case 6:
      otherActivityList = activityList_social;
      otherActivityTitle = "SOCIAL";
      break;
  }

  console.clear();
  displayPlayerInfo();

  console.log(`${otherActivityTitle} | selecione a atividade`);
  console.log();

  // exibe as opรงรตes (submenu) ๐

  for (let activity of otherActivityList) {
    console.log(`[${activity.index}] ${activity.title.toUpperCase()}`);
  }

  console.log();

  // solicita a escolha da atividade ๐

  otherActivityChoiceIndex = validatePromptIntMinMax(
    "sua escolha",
    otherActivityList.length - 1,
    0,
    `digite um NรMERO INTEIRO entre 0 e ${otherActivityList.length - 1}`
  );

  chosenOtherActivity = otherActivityList[otherActivityChoiceIndex];

  // altera o objeto chosenActivity com as opรงรตes escolhidas ๐

  let otherActivity = {
    type: chosenActivityType,
    title: chosenOtherActivity.title.toUpperCase(),
    cost: chosenOtherActivity.cost,
    timeToComplete: chosenOtherActivity.timeToComplete,
    needsModification: chosenOtherActivity.needsModification,
  };

  Object.assign(
    chosenActivity.needsModification,
    chosenOtherActivity.needsModification
  );
  Object.assign(chosenActivity, otherActivity);

  chosenActivity.displayChosenActivityInfo();

  // dรก ao jogador a opรงรฃo de confirmar a seleรงรฃo ou voltar e escolher novamente ๐

  confirmChoice = confirmation();
  return confirmChoice;
};

// ----- executa a atividade selecionada ๐๐

const doNextActivity = (chosenActivityType) => {
  switch (chosenActivityType) {
    case 0: {
      doWork(chosenActivity); // executa a atividade TRABALHAR
      break;
    }
    case 1: {
      doNutritionActivity(chosenActivity); // executa a atividade NUTRIรรO
      break;
    }
    case 2: {
      doEnergyActivity(chosenActivity); // executa a atividade DORMIR
      break;
    }
    default: {
      doOtherActivity(chosenActivity); // executa a atividade HIGIENE, BANHEIRO, DIVERSรO ou SOCIAL
      break;
    }
  }
};

// ----- executa a atividade TRABALHAR ๐

const doWork = (chosenActivity) => {
  workAnimation();
  time.increment(chosenActivity.timeToComplete);
  player.wallet += chosenActivity.work.earnedNow;
  player.updateNeeds(chosenActivity);
  records.work.totalTimes++;
  records.work.totalHours += chosenActivity.work.hoursWorked;
  records.work.totalEarnings += chosenActivity.work.earnedNow;
};

// ----- executa a atividade de NUTRIรรO escolhida ๐

const doNutritionActivity = (chosenActivity) => {
  nutritionAnimation();
  time.increment(chosenActivity.timeToComplete);
  player.updateWallet(chosenActivity.cost);
  player.updateNeeds(chosenActivity);
  records["nutrition"][chosenActivity.typeString]["totalTimes"]++;
  records.nutrition.totalCost += chosenActivity.cost;
  records.nutrition.totalMinutes += chosenActivity.timeToComplete;
};

// ----- executa a atividade DORMIR ๐

const doEnergyActivity = (chosenActivity) => {
  energyAnimation(time.hours, time.minutes, chosenActivity.needsModification.energy);
  time.increment(chosenActivity.timeToComplete);
  player.updateNeeds(chosenActivity);
  records.energy.totalTimes++;
  records.energy.totalHours += chosenActivity.needsModification.energy;
};

// ----- executa a atividade de HIGIENE, BANHEIRO, DIVERSรO ou SOCIAL ๐

const doOtherActivity = (chosenActivity) => {
  switch (chosenActivity.type) {
    case 3: {
      hygieneAnimation();
      records.hygiene.totalTimes++;
      records.hygiene.totalCost += chosenActivity.cost;
      records.hygiene.totalMinutes += chosenActivity.timeToComplete;
      break;
    }
    case 4: {
      toiletAnimation();
      records.toilet.totalTimes++;
      records.toilet.totalCost += chosenActivity.cost;
      records.toilet.totalMinutes += chosenActivity.timeToComplete;
      break;
    }
    case 5: {
      funAnimation();
      records.fun.totalTimes++;
      records.fun.totalCost += chosenActivity.cost;
      records.fun.totalMinutes += chosenActivity.timeToComplete;
      break;
    }
    case 6: {
      socialAnimation();
      records.social.totalTimes++;
      records.social.totalCost += chosenActivity.cost;
      records.social.totalMinutes += chosenActivity.timeToComplete;
      break;
    }
  }

  time.increment(chosenActivity.timeToComplete);
  player.updateWallet(chosenActivity.cost);
  player.updateNeeds(chosenActivity);
};

// ----- DISPLAY FORMATTED INFO ----- ๐๐๐

// ----- exibe as informaรงรตes do jogador ๐๐

const displayPlayerInfo = () => {
  console.log(gameName);

  console.log(`๐ DIA ${(time.days + 1).toString().padStart(2,"0")} | ${time.getWeekDay()} ๐ ${time.getTime()} (${time.getPeriod()})

๐ค ${player.name}
๐ฒ ${`$ ${player.wallet}`}
๐ผ ${player.job.title}

---------------------------
๐  ${player.needs.nutrition.toString().padStart(2, "0")}      ๐งผ  ${player.needs.hygiene.toString().padStart(2, "0")}      ๐  ${player.needs.fun.toString().padStart(2, "0")}
๐ค  ${player.needs.energy.toString().padStart(2, "0")}      ๐ฝ  ${player.needs.toilet.toString().padStart(2, "0")}      ๐ฌ  ${player.needs.social.toString().padStart(2, "0")}
---------------------------
`);
};

// retorna as modificaรงรตes de atributos formatadas. ex: ๐ +1 | ๐ฝ -3 ๐๐

const getFormattedNeedsModification = (needsModification) => {
  const needsModificationList = [];
  const needsModificationKeys = [
    "nutrition",
    "energy",
    "hygiene",
    "toilet",
    "fun",
    "social",
  ];

  for (let key of needsModificationKeys) {
    if (needsModification[key] > 0 || needsModification[key] < 0) {
      needsModificationList.push([key, needsModification[key]]);
    }
  }

  const needsModificationFormatted = [];

  for (let need of needsModificationList) {
    let needEmoji;
    let valueFormated = need[1].toString().padStart(2, "+");

    switch (need[0]) {
      case "nutrition":
        needEmoji = "๐";
        break;
      case "energy":
        needEmoji = "๐ค";
        break;
      case "hygiene":
        needEmoji = "๐งผ";
        break;
      case "toilet":
        needEmoji = "๐ฝ";
        break;
      case "fun":
        needEmoji = "๐";
        break;
      case "social":
        needEmoji = "๐ฌ";
        break;
    }

    needsModificationFormatted.push(`${valueFormated} ${needEmoji}`);
  }

  let needsModificationString = needsModificationFormatted.join(" | ");
  return needsModificationString;
};

// ----- CODE START ----- ๐๐๐

const gameName = formatToTitle("ึวสวสษจสษ");
let confirmChoice;

// ----- TELA INCIAL -----๐๐๐

// ----- seleรงรฃo das caracterรญsticas do jogador (nome e profissรฃo) !!: ๐๐

console.clear();
console.log(gameName);

// solicita o nome do jogador e adiciona no objeto player ๐

player.name = validatePromptString(
  "digite seu nome:",
  "o nome nรฃo pode ser vazio"
);

console.clear();

// solicita a seleรงรฃo da profissรฃo do jogador ๐

let jobChoiceIndex;
let chosenJob;

// repete a seleรงรฃo da profissรฃo atรฉ a confirmaรงรฃo do jogador ๐

while (true) {
  console.log(gameName);

  console.log("escolha sua profissรฃo no jogo");
  console.log();

  for (let job of jobList) {
    console.log(`[${job.index}] ${job.title}`);
  }

  console.log();

  jobChoiceIndex = validatePromptIntMinMax(
    "sua escolha:",
    jobList.length,
    0,
    `digite um NรMERO INTEIRO entre 0 e ${jobList.length - 1}`
  );

  chosenJob = jobList[jobChoiceIndex];

  console.clear();
  console.log(gameName);

  // exibe a opรงรฃo selecionada ๐

  console.log(`profissรฃo selecionada | ${chosenJob.title.toUpperCase()}
  
  dias: ${chosenJob.daysToWork}
  horรกrio: ${chosenJob.periodsToWork}
  salรกrio: $${chosenJob.salaryPerHour}/hora
  carga horรกria mรญnima: ${chosenJob.minHoursPerWeek}h/semana
  `);

  // dรก ao jogador a opรงรฃo de confirmar a seleรงรฃo ou voltar e escolher novamente ๐

  confirmChoice = confirmation();

  if (confirmChoice == 1) {
    break;
  }
}

// atualiza o objeto player com os detalhes da profissรฃo escolhida ๐

player.updatePlayerJob(chosenJob);

// ----- ABOUT -----๐๐

console.clear();
console.log(gameName);

console.log(`viu como รฉ fรกcil, ${player.name}?
vocรช jรก estรก jogando!

nรฃo se esqueรงa de maximizar seu terminal!

`);

formatPrompt("ENTER");

// ----- OBJETIVO e outras informaรงรตes ๐

console.clear();
console.log(gameName);

console.log(`# OBJETIVO DO JOGO:

+ medir o equilรญbrio entre TRABALHO, SAรDE MENTAL e SAรDE FรSICA
em uma simulaรงรฃo de vida real por 7 dias

# COMO?

+ realizando tarefas e cuidando das suas necessidades fรญsicas e mentais (ATRIBUTOS)

# ATRIBUTOS:

๐ nutriรงรฃo
๐ค energia
๐งผ higiene
๐ฝ banheiro
๐ diversรฃo
๐ฌ social

๐จ IMPORTANTE!

+ seus atributos atualizam automaticamente a cada perรญodo (manhรฃ, tarde e noite)
+ cuidado para nรฃo deixar nenhum deles chegar a 0! garanto que nรฃo vai gostar!

`);

formatPrompt("ENTER");

console.clear();
console.log(gameName);

console.log(`agora รฉ sรณ apertar ENTER pra comeรงar!
`);

formatPrompt("ENTER");

console.clear();

// ----- MENU PRINCIPAL -----๐๐๐

let mainMenuChoice;

const mainMenu = [
  "TRABALHO",
  "NUTRIรรO",
  "ENERGIA",
  "HIGIENE",
  "BANHEIRO",
  "DIVERSรO",
  "SOCIAL",
];

// ----- solicita a seleรงรฃo da prรณxima atividade atรฉ o fim do jogo (> 7 dias) ๐๐

while (true) {
  let currentPeriod = time.getPeriod(); // variรกveis para definiรงรฃo de update autรดnomo baseado na mudanรงa de perรญodo
  let newPeriod;

  // ----- repete a seleรงรฃo da atividade (MENU e SUBMENU) atรฉ a confirmaรงรฃo do jogador ๐๐

  while (true) {
    // exibe dia/hora + status dos atributos ๐

    displayPlayerInfo();

    console.log(`selecione a prรณxima atividade`);
    console.log();

    // exibe as opรงรตes (MENU PRINCIPAL) ๐๐

    for (let option of mainMenu) {
      console.log(`[${mainMenu.indexOf(option)}] ${option}`);
    }

    console.log();

    // solicita a seleรงรฃo da atividade

    mainMenuChoice = validatePromptIntMinMax(
      "sua escolha:",
      mainMenu.length - 1,
      0,
      `digite um NรMERO INTEIRO entre 0 e ${mainMenu.length - 1}`
    );

    console.log();

    // ----- SUBMENU -----๐๐

    // ----- exibe opรงรตes adicionais e confirma a seleรงรฃo da atividade ๐

    switch (mainMenuChoice) {
      case 0: {
        confirmChoice = submenuWork(); // submenu TRABALHAR
        break;
      }
      case 1: {
        confirmChoice = submenuNutrition(); // submenu NUTRIรรO
        break;
      }
      case 2: {
        confirmChoice = submenuEnergy(); // submenu ENERGIA
        break;
      }
      default: {
        confirmChoice = submenuOther(mainMenuChoice); // submenu HIGIENE, BANHEIRO, DIVERSรO E SOCIAL
        break;
      }
    }

    if (confirmChoice == 1) {
      break;
    }
  }

  // ----- executa a atividade selecionada ๐

  doNextActivity(chosenActivity.type);
  console.clear();

  // ----- atualiza os atributos de forma autรดnoma a cada troca de perรญodo ๐๐

  newPeriod = time.getPeriod();

  if (currentPeriod != newPeriod) {
    player.updateNeedsAutonomous();
  }

  // ----- atividades autรดnomas disparadas por necessidade <= 0 ๐๐

  lowNeedActivities.triggerAction();

  // ----- finaliza o jogo apรณs 7 dias completos ๐๐

  let dayNumberToday = time.getDay();

  // ๐จ๐จ ๐

  if (dayNumberToday > 2) {
    break;
  }
}
// ----- tela GAME OVER ----- ๐๐๐

gameOverAnimation();

console.log('"a vida รฉ como um jogo\ne cada vez que damos um passo\nnรณs caminhamos para o GAME OVER."');

console.log();
formatPrompt("digite ENTER para ver seus resultados");
console.clear();

// ----- exibe os resultados atรฉ o jogador escolher sair ๐๐

while (true) {
  // ----- TELA 1 - รREAS (trabalho, saรบde fรญsica e saรบde mental) ๐

  console.log(formatToTitle("TRABALHO"));

  if (records.work.totalHours > player.job.minHoursPerWeek + 5) {
    console.log("vocรช foi alรฉm das expectativas!\n\nparabรฉns pela sua PROMOรรO! vocรช mereceu! โจ");
  } else if (records.work.totalHours < player.job.minHoursPerWeek - 5) {
    console.log("vocรช nรฃo trabalhou o mรญnimo de horas necessรกrias.\ninfelizmente, vocรช foi demitido. ๐ธ");
  } else {
    console.log("vocรช cumpriu com suas expectativas no trabalho.");
  }

  console.log();
  sleep(1000);

  console.log(formatToTitle("SAรDE FรSICA"));

  if (records.lowNeedAreas.physicalHealth < 3) {
    console.log("nossa, mas que corpo bem cuidado!\nvocรช virou influencer fitness e agora ganha milhรตes nas redes sociais! ๐ช");
  } else if (records.lowNeedAreas.physicalHealth < 7) {
    console.log("vocรช precisa se cuidar melhor, hein?\nvocรช desenvolveu uma doenรงa crรดnica e agora passa seus dias no hospital. ๐ท");
  } else {
    console.log("vocรช cuidou do seu corpo direitinho, parabรฉns!");
  }

  console.log();
  sleep(1000);

  console.log(formatToTitle("SAรDE MENTAL"));

  if (records.lowNeedAreas.mentalHealth < 3) {
    console.log("uau! que mente equilibrada!\nvocรช virou coach good vibes e ajuda muitas pessoas! โฎ");
  } else if (records.mentalHealth.mental < 7) {
    console.log("vocรช nรฃo aguentou o stress e foi internado em uma cรญnica psiquiรกtrica. ๐ญ");
  } else {
    console.log("vocรช cuidou do seu corpo direitinho, parabรฉns!");
  }

  console.log();
  sleep(1000);

  formatPrompt("digite ENTER para continuar");

  // ----- TELA 2 - ESTATรSTICAS ๐

  statisticsAnimation();

  sleep(1000);

  console.log(formatToTitle("TRABALHO"));
  console.log(`trabalhou ${records.work.totalTimes} vezes`);
  console.log(`๐ ${records.work.totalHours}h\t๐ฒ +$${records.work.totalEarnings}`);

  console.log();
  sleep(1000);

  console.log(formatToTitle("ENERGIA"));
  console.log(`chegou a 0 (OH NO!) ${records.lowNeedActivities.energy.totalTimes} vezes`);
  console.log();
  console.log(`dormiu ${records.energy.totalTimes} vezes`);
  console.log();
  console.log(`๐ ${records.energy.totalHours}h`);

  console.log();
  sleep(1000);

  console.log(formatToTitle("NUTRIรรO"));
  console.log(`chegou a 0 (OH NO!) ${records.lowNeedActivities.nutrition.totalTimes}  vezes`);
  console.log();
  console.log(`cozinhou ${records.nutrition.cook.totalTimes} vezes`);
  console.log(`pediu delivery ${records.nutrition.delivery.totalTimes} vezes`);
  console.log(`comeu no restaurante ${records.nutrition.eatOut.totalTimes} vezes`);
  console.log();
  console.log(`๐ ${formatClock(Math.floor(records.nutrition.totalMinutes / 60), records.nutrition.totalMinutes % 60)}\t๐ฒ -$${records.nutrition.totalCost}`);

  console.log();
  sleep(1000);

  const otherNeedsKeys = ["hygiene", "toilet", "fun", "social"];

  for (let key of otherNeedsKeys) {
    switch (key) {
      case "hygiene": {
        console.log(formatToTitle("HIGIENE"));
        console.log(`chegou a 0 (OH NO!) ${records["lowNeedActivities"][key]["totalTimes"]} vezes`);
        console.log();
        console.log(`ficou cheiroso ${records[key]["totalTimes"]} vezes`);
        break;
      }
      case "toilet": {
        console.log(formatToTitle("BANHEIRO"));
        console.log(`chegou a 0 (OH NO!) ${records["lowNeedActivities"][key]["totalTimes"]} vezes`);
        console.log();
        console.log(`usou a casinha ${records[key]["totalTimes"]} vezes`);
        break;
      }
      case "fun": {
        console.log(formatToTitle("DIVERSรO"));
        console.log(`chegou a 0 (OH NO!) ${records["lowNeedActivities"][key]["totalTimes"]} vezes`);
        console.log();
        console.log(`curtiu a vida ${records[key]["totalTimes"]} vezes`);
        break;
      }
      case "social":
        console.log(formatToTitle("SOCIAL"));
        console.log(`chegou a 0 (OH NO!) ${records["lowNeedActivities"][key]["totalTimes"]} vezes`);
        console.log();
        console.log(`jogou conversa fora ${records[key]["totalTimes"]} vezes`);
        break;
    }
    console.log();
    console.log(`๐ ${formatClock(Math.floor(records[key]["totalMinutes"] / 60), records[key]["totalMinutes"] % 60)}\t๐ฒ -$${records[key]["totalCost"]}`);

    console.log();
  }

  // sair do jogo ou voltar ร? tela anterior ๐

  let endGame = validatePromptIntMinMax(
    "digite [0] para sair\ndigite [1] para voltar ร? tela anterior",
    1,
    0,
    "vocรช deve digitar [0] ou [1]"
  );

  console.clear();

  if (endGame == 0) {
    break;
  }
}
