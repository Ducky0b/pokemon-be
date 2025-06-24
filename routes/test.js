const fs = require("fs");
const csv = require("csvtojson");

async function createPokemon() {
  try {
    const newData = await csv().fromFile("pokemon2.csv");
    console.log(newData.slice(0, 10));
  } catch (error) {
    console.log(error);
  }
}
createPokemon();
