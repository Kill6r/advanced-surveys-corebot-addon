const Discord = require("discord.js");
const Utils = require("../src/modules/utils");
const CommandHandler = require("../src/modules/handlers/CommandHandler");
const EventHandler = require("../src/modules/handlers/EventHandler.js");
const chalk = require("chalk");
const axios = require("axios");
const db = require("quick.db");
const map = new Map();
const prefix =
  chalk.hex("efb810").bold("[") +
  chalk.blue.bold("Surveys") +
  chalk.hex("efb810").bold("]");

module.exports = {
  run: async (bot) => {
    /* #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Variables, Schemas Mongoose & Funciones -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=# */
    let color;
    let errorColor;

    db.findOne = (search) => {
      /* Check if search is an object */
      if (typeof search !== "object")
        return console.log(
          `\x1b[33m[WARNING] \x1b[0mThe information obtained is not an object.`
        );

      let data = null;
      db.all().forEach((i, index) => {
        let found = db.get(i.ID);
        Object.keys(search).forEach((key) => {
          if (found[key] === search[key]) {
            data = found;
          }
        });
      });
      if (data === null)
        return console.log(
          `\x1b[33m[WARNING] \x1b[0mThe database does not contain the requested information.`
        );
      return data;
    };
    db.find = (search) => {
      /* Check if search is an object */
      if (!search)
        return console.log(
          `\x1b[33m[WARNING] \x1b[0mThe information obtained is not an object.`
        );
      if (typeof search !== "object")
        return console.log(
          `\x1b[33m[WARNING] \x1b[0mThe information obtained is not an object.`
        );

      let data = [];
      db.all().forEach((i, index) => {
        let found = db.get(i.ID);
        Object.keys(search).forEach((key) => {
          if (found[key] === search[key]) {
            data.push(found);
          }
        });
      });
      if (!data)
        return console.log(
          `\x1b[33m[WARNING] \x1b[0mThe database does not contain the requested information.`
        );
      return data;
    };
    db.all_fixed = () => {
      let data = [];
      db.all().forEach((i, index) => {
        let found = db.get(i.ID);
        data.push({
          Id: i.ID,
          data: found,
        });
      });
      if (!data)
        return console.log(
          `\x1b[33m[WARNING] \x1b[0mThe database does not contain the requested information.`
        );
      return data;
    };
    /* console.log(db.findOne({ messageId: '986117562687430676' })) */

    async function Color() {
      const yml = require("../src/modules/yml.js");
      const cfg = await yml("./configs/config.yml");
      color = cfg.EmbedColors.Default.replace(/#/g, "");
      errorColor = cfg.EmbedColors.Error.replace(/#/g, "");
    }
    Color();

    let Config = async () => {
      const yml = require("../src/modules/yml.js");
      const cfg = await yml("./configs/addons/surveys_config.yml");
      return cfg;
    };
    Config = await Config();

    function timeCalculate(time) {
      function getTimeElement(letter) {
        const find = time.toLowerCase().match(new RegExp(`\\d+${letter}`));
        return parseInt(find ? find[0] : 0);
      }
      const mins = getTimeElement("m");
      const hours = getTimeElement("h");
      const days = getTimeElement("d");

      let total = 0;
      total += mins * 60000;
      total += hours * 60 * 60000;
      total += days * 24 * 60 * 60000;
      let endAt = Date.now() + total;
      endAt = `${endAt / 1000}`;
      return endAt.split(".")[0];
    }

    async function SurveysTime() {
      let datos = db.all_fixed();
      datos.forEach(async (o, index) => {
        i = o.data;
        if ((i?.time ?? false) !== false) {
          let time = Number(i.time);
          if ((i?.finish ?? false) === false) {
            if (new Date() / 1000 >= time) {
              try {
                await bot.channels.cache
                  .get(i.channelId)
                  .messages.fetch(i.messageId)
                  .then(async (msg) => {
                    msg.components[0].components.forEach((i, index) => {
                      msg.components[0].components[index].disabled = true;
                    });

                    let numbers = [];

                    for (let q = 0; q < o.data.votes.length; q++) {
                      numbers.push(o.data.votes[q].votes.length);
                    }

                    let names = o.data.options;
                    await msg.edit({
                      content: Config.Messages.Replys[5],
                      embeds: [msg.embeds[0]],
                      components: msg.components,
                    });
                    let ganador = names[numbers.indexOf(Math.max(...numbers))];
                    msg.reply(
                      Config.Messages.Replys[4]
                        .replaceAll(/{winner}/g, `${ganador}`)
                        .replaceAll(/{votes}/g, `${Math.max(...numbers)}`)
                    );
                  });
                db.set(o.Id, { ...o.data, finish: true });
              } catch (error) {
                console.log(error);
              }
            }
          }
        }
      });
    }
    setInterval(() => {
      SurveysTime();
    }, 10000);

    const request = async (data) => {
      const imageApiUrl = process.env.IMAGE_API_URL || "http://localhost:8250";
      const res = await axios.post(`${imageApiUrl}/api/image`, data);
      return res;
    };

    const Row = Discord.MessageActionRow;
    const Embed = Discord.MessageEmbed;
    const Button = Discord.MessageButton;
    const Modal = Discord.Modal;
    const Text = Discord.TextInputComponent;

    /* Table */
    const style = {
      name: "custom",
      borders: {
        top: {
          left: "┌",
          center: "─",
          right: "┐",
          colSeparator: "─",
        },
        middle: {
          left: "│",
          center: "─",
          right: "│",
          colSeparator: "│",
        },
        bottom: {
          left: "└",
          center: "─",
          right: "┘",
          colSeparator: "─",
        },
        data: {
          left: "│",
          center: " ",
          right: "│",
          colSeparator: "│",
        },
      },
    };
    const { AsciiTable3 } = require("ascii-table3");

    const Licencia = async () => {
      const licenseApiUrl = process.env.LICENSE_API_URL || "http://localhost:8250";
      const res = await axios.post(`${licenseApiUrl}/api/licenses`, {
        key: "chucho0303",
      });
      const data = res.data.filter(
        (i) => i.licencia === Config.License && i.producto === "Surveys"
      );
      return data;
    };

    let busqueda = await Licencia();
    if (busqueda[0] === undefined) {
      let table = new AsciiTable3(chalk.hex("88e5f7").bold("Surveys"));
      table
        .setHeading(chalk.gray.bold("License"), chalk.gray.bold("Type"))
        .addRow(chalk.yellow(`${Config.License}`), chalk.red("Invalid"));

      table.addStyle(style);
      table.setStyle("custom");

      console.log("\n" + table.toString());

      console.log(
        prefix + " Addon unloaded (" + chalk.gray.bold("v2.7.0") + ")"
      );
      console.log(
        prefix +
          chalk.red(
            " The key is not correct, please change the key from the config file and then restart the bot."
          )
      );
      return;
    }
    if (busqueda[0].tipo === false || busqueda[0].tipo === undefined) {
      let table = new AsciiTable3(chalk.hex("88e5f7").bold("Surveys"));
      table
        .setHeading(
          chalk.gray.bold("Created"),
          chalk.gray.bold("License"),
          chalk.gray.bold("Type")
        )
        .addRow(
          chalk.yellow(`${busqueda[0].creada}`),
          chalk.yellow(`${Config.License}`),
          chalk.red("Invalid")
        );

      table.addStyle(style);
      table.setStyle("custom");

      console.log("\n" + table.toString());

      console.log(
        prefix + " Addon unloaded (" + chalk.gray.bold("v2.7.0") + ")"
      );
      console.log(
        prefix +
          chalk.red(
            " The key is not correct, please change the key from the config file and then restart the bot."
          )
      );
      return;
    }
    let table = new AsciiTable3(chalk.blue.bold("Surveys"));
    table
      .setHeading(
        chalk.gray.bold("Created"),
        chalk.gray.bold("License"),
        chalk.gray.bold("Type")
      )
      .addRow(
        chalk.yellow(`${busqueda[0].creada}`),
        chalk.yellow(`${Config.License}`),
        chalk.green("Valid")
      );

    table.addStyle(style);
    table.setStyle("custom");

    console.log("\n" + table.toString());

    console.log(prefix + " Addon loaded (" + chalk.gray.bold("v2.7.0") + ")");

    /* #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Comandos -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=# */

    EventHandler.set("interactionCreate", async (bot, int) => {
      if (int.isButton()) {
        if (int.customId === `sendSurvey`) {
          let data = map.get(`survey_${int.message.id}`);
          if (data?.time && data?.options) {
            await bot.channels.cache
              .get(int.channel.id)
              .messages.fetch(data.message_1)
              .then(async (msg) => {
                msg.embeds[0].fields = [];

                for (let i = 0; i < data.options.length; i++) {
                  msg.embeds[0].fields.push({
                    name: `${Config.Messages.Survey.Fields[0].Name}`
                      .replace(
                        /{emoji}/g,
                        `${
                          data.options[i].emoji === null
                            ? ``
                            : data.options[i].emoji
                        }`
                      )
                      .replace(/{text}/g, `${data.options[i].question}`),
                    value: `${Config.Messages.Survey.Fields[0].Value}`
                      .replace(/{load}/g, "``                      ``")
                      .replace(/{percentage}/g, `0%`)
                      .replace(/{number}/g, `0`),
                    inline: true,
                  });
                }
                msg.embeds[0].fields.push({
                  name: `${Config.Messages.Survey.Fields[1].Name}`.replaceAll(
                    /{date}/g,
                    `<t:${data.time}>`
                  ),
                  value: `${Config.Messages.Survey.Fields[1].Value}`.replaceAll(
                    /{date}/g,
                    `<t:${data.time}>`
                  ),
                  inline: true,
                });

                let rows = [];

                data.options.forEach((i, index) => {
                  index = index + 1;
                  let num = 0;
                  if (index - 1 === 0) {
                    num = 0;
                    rows.push({
                      type: 1,
                      components: [],
                    });
                  } else if (index - 1 === 9) {
                    num = 1;
                    rows.push({
                      type: 1,
                      components: [],
                    });
                  } else if (index - 1 === 14) {
                    num = 2;
                    rows.push({
                      type: 1,
                      components: [],
                    });
                  } else if (index - 1 === 19) {
                    num = 3;
                    rows.push({
                      type: 1,
                      components: [],
                    });
                  } else if (index - 1 === 24) {
                    num = 4;
                    rows.push({
                      type: 1,
                      components: [],
                    });
                  }

                  if (i.emoji === null) {
                    rows[num].components.push(
                      new Button()
                        .setCustomId(`surveys_buttons_${index}`)
                        .setLabel(`${i.question}`)
                        .setStyle("PRIMARY")
                    );
                  } else {
                    rows[num].components.push(
                      new Button()
                        .setCustomId(`surveys_buttons_${index}`)
                        .setLabel(`${i.question}`)
                        .setEmoji(`${i.emoji}`)
                        .setStyle("PRIMARY")
                    );
                  }
                });

                try {
                  await bot.channels.cache
                    .get(int.channel.id)
                    .messages.fetch(data.message_1)
                    .then(async (m) => {
                      m.delete();
                    });
                  await bot.channels.cache
                    .get(int.channel.id)
                    .messages.fetch(data.message_2)
                    .then(async (m) => {
                      m.delete();
                    });
                } catch (e) {}

                int.channel
                  .send({ embeds: [msg.embeds[0]], components: rows })
                  .then((msg) => {
                    let options = [];
                    data.options.forEach((i) => options.push(i.question));

                    let votes = [];
                    data.options.forEach((i) =>
                      votes.push({
                        name: i.question,
                        votes: [],
                        emoji: i.emoji,
                      })
                    );

                    db.set(`survey_${msg.id}`, {
                      messageId: msg.id,
                      channelId: int.channel.id,
                      options: options,
                      votes: votes,
                      time: data.time,
                    });
                  });
              });
          } else {
            return int.reply({
              content: Config["Messages Error"].Survey[0],
              ephemeral: true,
            });
          }
        } else if (int.customId.startsWith("surveys_buttons_")) {
          let option = Number(int.customId.replace("surveys_buttons_", "")) - 1;
          let found = db.findOne({ messageId: int.message.id });

          /*                     found.votes.forEach((i, index) => {
                                            found.votes[index].votes = []
                                        }) */

          /* Filter */
          let result = true;
          found.votes.forEach((i, index) => {
            let found = i.votes.find((v) => v === int.user.id) ?? false;
            if (found !== false) result = index;
          });
          if (result !== option && result !== true) {
            let voteEmbed = new Embed()
              .setDescription(
                Config.Messages.Replys[2].replaceAll(
                  /{vote}/g,
                  `${found.votes[option].name}`
                )
              )
              .setColor(color || errorColor);
            int.reply({ embeds: [voteEmbed], ephemeral: true });

            found.votes[result].votes = found.votes[result].votes.filter(
              (i) => i !== int.user.id
            );
            found.votes[option].votes.push(int.user.id);
          } else if (result === option) {
            let voteEmbed = new Embed()
              .setDescription(
                Config.Messages.Replys[3].replaceAll(
                  /{vote}/g,
                  `${found.options[result]}`
                )
              )
              .setColor(color || errorColor);
            int.reply({ embeds: [voteEmbed], ephemeral: true });

            found.votes[option].votes = found.votes[option].votes.filter(
              (i) => i !== int.user.id
            );
          } else {
            let voteEmbed = new Embed()
              .setDescription(
                Config.Messages.Replys[2].replaceAll(
                  /{vote}/g,
                  `${found.options[option]}`
                )
              )
              .setColor(color || errorColor);
            int.reply({ embeds: [voteEmbed], ephemeral: true });

            found.votes[option].votes.push(int.user.id);
          }

          db.set(`survey_${int.message.id}`, found);

          let total = () => {
            let suma = 0;
            for (let i = 0; i < found.votes.length; i++)
              suma += found.votes[i].votes.length;
            return suma;
          };

          let embed = int.message.embeds[0];
          embed.fields = [];

          let labels = [];
          let dataLabel = [];

          for (let i = 0; i < found.votes.length; i++) {
            let comilla = "`";
            let porcentaje = (found.votes[i].votes.length / total()) * 100;
            let porcentaje_fixed =
              porcentaje
                .toFixed(2)
                .replace("NaN", "0")
                .replace("66.66666666666666", "66.6") + "%";
            let porcentajeEmoji =
              porcentaje <= 0
                ? "`                     `"
                : porcentaje < 10
                ? "`█████               `"
                : porcentaje < 20
                ? "`███████             `"
                : porcentaje < 30
                ? "`████████             `"
                : porcentaje < 40
                ? "`███████████          `"
                : porcentaje < 50
                ? "`█████████████        `"
                : porcentaje < 60
                ? "`███████████████      `"
                : porcentaje < 70
                ? "`████████████████     `"
                : porcentaje < 80
                ? "`█████████████████    `"
                : porcentaje < 99
                ? "`██████████████████   `"
                : porcentaje < 100
                ? "`█████████████████████`"
                : porcentaje < 200
                ? "`█████████████████████`"
                : `                     `;
            embed.addField(
              `${Config.Messages.Survey.Fields[0].Name}`
                .replace(
                  /{emoji}/g,
                  `${found.votes[i].emoji === null ? `` : found.votes[i].emoji}`
                )
                .replace(/{text}/g, `${found.votes[i].name}`),
              `${Config.Messages.Survey.Fields[0].Value}`
                .replace(/{load}/g, `${comilla}${porcentajeEmoji}${comilla}`)
                .replace(/{percentage}/g, `${porcentaje_fixed}`)
                .replace(/{number}/g, `${found.votes[i].votes.length}`),
              true
            );
            let num = found.votes[i].votes.length;
            dataLabel.push(num + 1);
            labels.push(found.votes[i].name);
          }
          embed.addField(
            `${Config.Messages.Survey.Fields[1].Name}`,
            `${Config.Messages.Survey.Fields[1].Value}`.replaceAll(
              /{date}/g,
              `<t:${found.time}>`
            ),
            true
          );
          if (Config.Messages.Survey.Image.Status === true) {
            let res = await request([
              labels,
              dataLabel,
              Config.Messages.Survey.Image,
            ]);
            if (res.status === 200) {
              embed.setImage(res.data.URL);
            } else {
              console.log(Utils.errorPrefix + res.message);
            }
          }

          await bot.channels.cache
            .get(found.channelId)
            .messages.fetch(found.messageId)
            .then(async (msg) => {
              msg.edit({ embeds: [embed] });
            });
        } else if (int.customId === "❌") {
          let data = map.get(`survey_${int.message.id}`);
          try {
            await bot.channels.cache
              .get(int.channel.id)
              .messages.fetch(data.message_1)
              .then(async (m) => {
                m.delete();
              });
            await bot.channels.cache
              .get(int.channel.id)
              .messages.fetch(data.message_2)
              .then(async (m) => {
                m.delete();
              });
          } catch (e) {}
        }
      }
      if (int.isModalSubmit()) {
        if (int.customId === `survey_2`) {
          const time = int.fields.getTextInputValue("end_option");
          let time_pattern = /^(\d+((h|H)|(d|D)|(m|M)))+$/; //RegExp made by the development of CoreBot

          if (!time_pattern.test(time)) {
            return int.reply({
              content: Config["Messages Error"].Survey[1],
              ephemeral: true,
            });
          }

          /* Buttons */
          let button1 = new Button()
            .setCustomId("1️⃣")
            .setEmoji("1️⃣")
            .setStyle("PRIMARY");
          let button2 = new Button()
            .setCustomId("2️⃣")
            .setEmoji("2️⃣")
            .setDisabled(true)
            .setStyle("PRIMARY");

          let button3 = new Button()
            .setCustomId("❌")
            .setEmoji("❌")
            .setStyle("SECONDARY");

          let sendSurvey = new Button()
            .setCustomId("sendSurvey")
            .setEmoji("✅")
            .setStyle("PRIMARY");

          /* Row */

          let rowButtons = new Row().addComponents(
            button1,
            button2,
            button3,
            sendSurvey
          );

          let setupSurvey = new Embed()
            .setTitle(Config.Messages["Create Survey 2"].Title)
            .setDescription(Config.Messages["Create Survey 2"].Description)
            .setTimestamp()
            .setFooter(`Survey System`, int.guild.iconURL({ dynamic: true }))
            .setColor(color ?? errorColor);

          await bot.channels.cache
            .get(int.channel.id)
            .messages.fetch(int.message.id)
            .then((msg) => {
              msg.edit({ embeds: [setupSurvey], components: [rowButtons] });
            });

          await bot.channels.cache
            .get(int.channel.id)
            .messages.fetch(map.get(`survey_${int.message.id}`).message_1)
            .then(async (msg) => {
              msg.embeds[0].fields.push({
                name: "End",
                value: `<t:${timeCalculate(time)}>`,
                inline: true,
              });
              msg.edit({ embeds: [msg.embeds[0]] });
              map.set(`survey_${int.message.id}`, {
                ...map.get(`survey_${int.message.id}`),
                time: timeCalculate(time),
              });
            });

          int.reply({
            content: Config.Messages.Replys[1],
            ephemeral: true,
          });
        } else if (int.customId === "survey") {
          const question = int.fields.getTextInputValue("one_option");
          const emoji = int.fields.getTextInputValue("two_option") || null;
          int.guild.channels.cache
            .get(int.channel.id)
            .messages.fetch(int.message.id)
            .then((msg) => {
              if (emoji !== null) {
                msg.react(`${emoji}`).catch((err) => {
                  let c = "`";
                  let cc = "```";
                  let embedERR = new Embed()
                    .setDescription(
                      `${c}❌${c} | Error: ${cc}js\n${err}\n${cc}`
                    )
                    .setColor(color ?? errorColor);

                  return int.reply({ embeds: [embedERR], ephemeral: true });
                });
              }
              msg.reactions.removeAll().catch();
              let data = map.get(`survey_${int.message.id}`);
              if (data?.options === undefined) {
                map.set(`survey_${int.message.id}`, {
                  message_1: data.message_1,
                  message_2: data.message_2,
                  time: data.time,
                  options: [{ question: question, emoji: emoji }],
                });
                int.reply({
                  content: Config.Messages.Replys[0],
                  ephemeral: true,
                });
              } else {
                map.set(`survey_${int.message.id}`, {
                  message_1: data.message_1,
                  message_2: data.message_2,
                  time: data.time,
                  options: [
                    ...data.options,
                    { question: question, emoji: emoji },
                  ],
                });
                int.reply({
                  content: Config.Messages.Replys[0],
                  ephemeral: true,
                });
              }

              bot.channels.cache
                .get(int.channel.id)
                .messages.fetch(map.get(`survey_${int.message.id}`).message_1)
                .then(async (msg) => {
                  msg.embeds[0].fields.push({
                    name: `${Config.Messages.Survey.Fields[0].Name}`
                      .replace(/{emoji}/g, `${emoji === null ? `` : emoji}`)
                      .replace(/{text}/g, `${question}`),
                    value: `${Config.Messages.Survey.Fields[0].Value}`
                      .replace(/{load}/g, "``                      ``")
                      .replace(/{percentage}/g, `0%`)
                      .replace(/{number}/g, `0`),
                    inline: true,
                  });
                  msg.edit({ embeds: [msg.embeds[0]] });
                  map.set(`survey_${int.message.id}`, {
                    ...map.get(`survey_${int.message.id}`),
                  });
                });
            });
        }
      }
    });

    CommandHandler.set({
      name: Config.Commands["Setup Survey"].Name,
      run: async (
        bot,
        int,
        args,
        {
          slashCommand,
          prefixUsed,
          commandUsed,
          type,
          user,
          member,
          guild,
          channel,
          reply,
        }
      ) => {
        if (int.interaction === null) {
          let answers = [];
          let msgIDs = [];

          /* Embed */
          let setupEmbed = new Embed()
            .setTitle(Config.Messages["Setup Survey"].Title)
            .setDescription(Config.Messages["Setup Survey"].Description)
            .setColor(color ?? errorColor);

          await int.channel
            .send({
              embeds: [setupEmbed],
            })
            .then((msg) => msgIDs.push(msg.id));
          let questions = Config.Messages["Setup Survey"].Questions || [
            "What is the title of the survey",
            "What is the description of the survey?, if you don't want a description type `no`.",
          ];
          async function waitForResponse(userid, channel) {
            const filtro = (m) => m.author.id == userid;
            return new Promise((resolve, reject) => {
              channel
                .awaitMessages({ filter: filtro, max: 1 })
                .then((msgs) => {
                  resolve(msgs.first());
                })
                .catch(reject);
            });
          }

          async function final(answers, msgIDs) {
            let answersUpdate = [];
            answers.forEach((i, index) => {
              answersUpdate.push({
                status: answers[index].status,
                content: answers[index].content,
              });
            });

            let title = answersUpdate[0].content;
            let description = answersUpdate[1].content;

            if (answersUpdate[1].status === false) description = null;

            let embedPreview = new Embed()
              .setTitle(
                Config.Messages.Survey.Title.replace(/{title}/g, `${title}`)
              )
              .setColor(color ?? errorColor);

            if (description) embedPreview.setDescription(description);
            await int.channel
              .send({
                content: "Survey Preview:",
                embeds: [embedPreview],
              })
              .then(async (msg) => {
                /* Buttons */
                let button1 = new Button()
                  .setCustomId("1️⃣")
                  .setEmoji("1️⃣")
                  .setStyle("PRIMARY");
                let button2 = new Button()
                  .setCustomId("2️⃣")
                  .setEmoji("2️⃣")
                  .setStyle("PRIMARY");

                let button3 = new Button()
                  .setCustomId("❌")
                  .setEmoji("❌")
                  .setStyle("SECONDARY");

                let sendSurvey = new Button()
                  .setCustomId("sendSurvey")
                  .setEmoji("✅")
                  .setStyle("PRIMARY");

                /* Row */

                let rowButtons = new Row().addComponents(
                  button1,
                  button2,
                  button3,
                  sendSurvey
                );

                let setupSurvey = new Embed()
                  .setTitle(Config.Messages["Create Survey"].Title)
                  .setDescription(Config.Messages["Create Survey"].Description)
                  .setTimestamp()
                  .setFooter(`Survey System`, guild.iconURL({ dynamic: true }))
                  .setColor(color ?? errorColor);

                await int.channel
                  .send({
                    content: "#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#",
                    embeds: [setupSurvey],
                    components: [rowButtons],
                  })
                  .then(async (msg2) => {
                    map.set(`survey_${msg2.id}`, {
                      message_1: msg.id,
                      message_2: msg2.id,
                    });

                    let filter = (i) => i.user.id === int.author.id;
                    let collector = int.channel.createMessageComponentCollector(
                      {
                        filter: filter,
                        time: 180000,
                      }
                    );

                    collector.on("collect", async (i) => {
                      if (i.customId === "1️⃣") {
                        const modal = new Modal()
                          .setTitle(Config.Modals.Title)
                          .setCustomId(`survey`);

                        const one_option = new Text()
                          .setCustomId("one_option")
                          .setLabel(Config.Modals.Texts[1])
                          .setStyle("SHORT")
                          .setRequired(true);

                        const two_option = new Text()
                          .setCustomId("two_option")
                          .setLabel(Config.Modals.Texts[0])
                          .setStyle("PARAGRAPH");

                        const row_1 = new Row().addComponents(one_option);

                        const row_2 = new Row().addComponents(two_option);

                        modal.addComponents(row_1, row_2);
                        await i.showModal(modal);
                      } else if (i.customId === "2️⃣") {
                        const modal = new Modal()
                          .setTitle(Config.Modals.Title)
                          .setCustomId(`survey_2`);

                        const end_option = new Text()
                          .setCustomId("end_option")
                          .setLabel(Config.Modals.Texts[2])
                          .setStyle("SHORT")
                          .setRequired(true);

                        const row_1 = new Row().addComponents(end_option);

                        modal.addComponents(row_1);
                        await i.showModal(modal);
                      } else if (i.customId === "❌") {
                      }
                    });
                    collector.on("end", async (i) => {
                      if (i.size <= 1) return;
                      /* Delete Message */
                      await msg.delete();
                      await msg2.delete();
                      map.delete(`survey_${msg.id}`);
                    });
                  });
              });

            /* Eliminar mensajes */

            msgIDs.forEach(async (i) => {
              await int.channel.messages
                .fetch(i)
                .then(async (m) => {
                  await m.delete();
                })
                .catch(async (e) => {});
            });
            await int.delete().catch(async (e) => {});
          }

          const askQuestion = async (i, ask) => {
            const question = questions[i];
            let texto = "{pos}";
            let embed2 = new Embed()
              .setTitle(texto.replace(/{pos}/g, `${i + 1}/` + questions.length))
              .setDescription(question)
              .setColor(color ?? errorColor);
            if (ask !== false)
              await int.channel
                .send({ embeds: [embed2] })
                .then((msg) => msgIDs.push(msg.id));

            await waitForResponse(int.author.id, int.channel).then(
              async (response) => {
                msgIDs.push(response.id);
                if (i === 1) {
                  if (
                    response.content.toLowerCase() === "no" ||
                    response.content.toLowerCase() === "'no'" ||
                    response.content.toLowerCase() === '"no"' ||
                    response.content.toLowerCase() === "`no`"
                  ) {
                    answers.push({
                      status: false,
                      content: `${response.content}`,
                    });
                  } else {
                    answers.push({
                      status: true,
                      content: `${response.content}`,
                    });
                  }
                } else {
                  answers.push({
                    status: true,
                    content: `${response.content}`,
                  });
                }

                if (i >= questions.length - 1) final(answers, msgIDs);
                else askQuestion(++i);
              }
            );
          };

          askQuestion(0, true);
        } else {
          let title = int.options.getString("title");
          let description = int.options.getString("description") || null;

          let embedPreview = new Embed()
            .setTitle(
              Config.Messages.Survey.Title.replace(/{title}/g, `${title}`)
            )
            .setColor(color ?? errorColor);

          if (description) embedPreview.setDescription(description);
          await reply({
            content: "Survey Preview:",
            embeds: [embedPreview],
          }).then(async (msg) => {
            /* Buttons */
            let button1 = new Button()
              .setCustomId("1️⃣")
              .setEmoji("1️⃣")
              .setStyle("PRIMARY");
            let button2 = new Button()
              .setCustomId("2️⃣")
              .setEmoji("2️⃣")
              .setStyle("PRIMARY");

            let button3 = new Button()
              .setCustomId("❌")
              .setEmoji("❌")
              .setStyle("SECONDARY");

            let sendSurvey = new Button()
              .setCustomId("sendSurvey")
              .setEmoji("✅")
              .setStyle("PRIMARY");

            /* Row */

            let rowButtons = new Row().addComponents(
              button1,
              button2,
              button3,
              sendSurvey
            );

            let setupSurvey = new Embed()
              .setTitle(Config.Messages["Create Survey"].Title)
              .setDescription(Config.Messages["Create Survey"].Description)
              .setTimestamp()
              .setFooter(`Survey System`, guild.iconURL({ dynamic: true }))
              .setColor(color ?? errorColor);

            await int.channel
              .send({
                content: "#=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#",
                embeds: [setupSurvey],
                components: [rowButtons],
              })
              .then(async (msg2) => {
                map.set(`survey_${msg2.id}`, {
                  message_1: msg.id,
                  message_2: msg2.id,
                });

                let filter = (i) => i.user.id === int.user.id;
                let collector = int.channel.createMessageComponentCollector({
                  filter: filter,
                  time: 180000,
                });

                collector.on("collect", async (i) => {
                  if (i.customId === "1️⃣") {
                    const modal = new Modal()
                      .setTitle(Config.Modals.Title)
                      .setCustomId(`survey`);

                    const one_option = new Text()
                      .setCustomId("one_option")
                      .setLabel(Config.Modals.Texts[1])
                      .setStyle("SHORT")
                      .setRequired(true);

                    const two_option = new Text()
                      .setCustomId("two_option")
                      .setLabel(Config.Modals.Texts[0])
                      .setStyle("PARAGRAPH");

                    const row_1 = new Row().addComponents(one_option);

                    const row_2 = new Row().addComponents(two_option);

                    modal.addComponents(row_1, row_2);
                    await i.showModal(modal);
                  } else if (i.customId === "2️⃣") {
                    const modal = new Modal()
                      .setTitle(Config.Modals.Title)
                      .setCustomId(`survey_2`);

                    const end_option = new Text()
                      .setCustomId("end_option")
                      .setLabel(Config.Modals.Texts[2])
                      .setStyle("SHORT")
                      .setRequired(true);

                    const row_1 = new Row().addComponents(end_option);

                    modal.addComponents(row_1);
                    await i.showModal(modal);
                  } else if (i.customId === "❌") {
                  }
                });
                collector.on("end", async (i) => {
                  if (i.size <= 1) return;
                  /* Delete Message */
                  await msg.delete();
                  await msg2.delete();
                  map.delete(`survey_${msg.id}`);
                });
              });
          });
        }
      },
      description: Config.Commands["Setup Survey"].Description,
      usage: Config.Commands["Setup Survey"].Usage.Text.replace(
        /survey/g,
        `${Config.Commands["Setup Survey"].Name}`
      ),
      aliases: [],
      type: "surveys",
      arguments: [
        {
          name: "title",
          description: Config.Commands["Setup Survey"].Usage.Title,
          required: true,
          type: "STRING",
        },
        {
          name: "description",
          description: Config.Commands["Setup Survey"].Usage.Description,
          required: false,
          type: "STRING",
        },
      ],
    });
  },
  messages: {
    loaded: ".",
    unloaded: prefix + "Addon unloaded (" + chalk.gray.bold("v2.7.0") + ")",
  },
  dependencies: ["quick.db@7.1.3", "ascii-table3", "axios"],
  configs: {
    config: {
      License: "Key",
      Commands: {
        "Setup Survey": {
          Name: "survey",
          Description: "To create surveys",
          Usage: {
            Title: "What is the title of the survey?",
            Description: "What is the description of the survey?",
            Text: "You have to put the command `/survey` and then follow the instructions.",
          },
        },
      },
      Messages: {
        "Setup Survey": {
          Title: "⚙️ | Setup System",
          Description: "`🔄` Please answer the following questions",
          Questions: [
            "What is the title of the survey",
            "What is the description of the survey?, if you don't want a description type `no`.",
          ],
        },
        "Create Survey": {
          Title: "📊 Create a Survey",
          Description:
            "1️⃣ **Add option to the survey**\n\n2️⃣ **Set the poll's ending date**\n\n **React with ❌ to cancel the setup**\n **React with ✅ to send the survey**",
        },
        "Create Survey 2": {
          Title: "📊 Create a Survey",
          Description:
            "1️⃣ **Add option to the survey**\n\n✅ **Set the poll's ending date**\n\n **React with ❌ to cancel the setup**\n **React with ✅ to send the survey**",
        },
        Survey: {
          Title: "📊 Survey | {title}",
          Fields: [
            {
              Name: "{emoji} {text}",
              Value: "{load} | {percentage} ({number})",
            },
            {
              Name: "End",
              Value: "{date}",
            },
          ],
          Image: {
            Status: true,
            Style: "Bar",
            "P.S": "You can add for the moment only 2 Styles, Circle & Bar.",
            Title: "Survey",
          },
        },
        Replys: [
          "The option has been added successfully",
          "The date has been successfully set",
          "You have successfully voted for **{vote}**",
          "You have successfully removed your vote for **{vote}**.",
          "The most voted is **{winner}** with **{votes}** votes.",
          "📊 **Survey completed** 📊",
        ],
      },
      "Messages Error": {
        Survey: [
          "You have to add an option & set the time to send the survey",
          "That format is invalid. Example: ``1d1h1m``. **Try again by pressing the button.**",
        ],
        "Command Error": {
          Title: "Error",
          Description:
            "`❌` | This command can only be used in slash, use `/survey` and try again.",
        },
      },
      Modals: {
        Title: "Surveys System",
        Texts: [
          "Set the emoji (Optional)",
          "Set the question",
          "Set the end date of the survey",
        ],
      },
    },
  },
};
