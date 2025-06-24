const { faker } = require('@faker-js/faker');
const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csvtojson");
/* GET pokemons listing. */
router.get("/", async function (req, res, next) {
  try {
    const newData = await csv().fromFile("pokemon2.csv");
    let transformedData = newData.map((item, index) => ({
      id: index + 1,
      name: item.name.toLowerCase(),
      description: faker.lorem.sentence(5),
      height: item.height_m,
      weight: item.weight_kg + ". lbs",
      category: item.classfication,
      abilities: item.abilities,
      types: [item.type1, item.type2]
        .filter(Boolean)
        .map((t) => t.toLowerCase()),
      url: `https://pokemon-be-tkcu.onrender.com/images/${index + 1}.png`,
    }));
    console.log(transformedData[0].url);
    //Lấy query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const search = req.query.search?.toLowerCase() || "";
    //Filter theo search
    if (search) {
      transformedData = transformedData.filter(
        (pokemon) =>
          pokemon.name.includes(search) || pokemon.types.includes(search)
      );
    }
    //Cắt data theo page
    const result = transformedData.slice(startIndex, endIndex);
    // Ghi vào db.json
    fs.writeFileSync(
      "db.json",
      JSON.stringify(
        { data: transformedData, page: page, limit: limit },
        null,
        2
      )
    );

    return res.json({
      page,
      limit,
      data: result,
      totalPokemons: transformedData.length,
    });
  } catch (err) {
    next(err);
  }
});
//Get pokemon id
router.get("/:id", async function (req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const raw = fs.readFileSync("db.json", "utf-8");
    const db = JSON.parse(raw);
    const allPokemons = db.data;
    // Tìm Pokémon theo id
    const index = allPokemons.findIndex((p) => p.id === id);
    const pokemon = allPokemons[index];
    const previousPokemon = index > 0 ? allPokemons[index - 1] : null;
    const nextPokemon =
      index < allPokemons.length - 1 ? allPokemons[index + 1] : null;
    if (!pokemon) {
      return res.status(404).json({ message: "Không tìm thấy Pokémon" });
    }

    return res.json({
      data: {
        previousPokemon,
        pokemon,
        nextPokemon,
      },
    });
  } catch (err) {
    next(err);
  }
});
//add pokemon
router.post("/", async function (req, res, next) {
  try {
    const raw = fs.readFileSync("db.json");
    const db = JSON.parse(raw);
    const pokemons = db.data;
    const { id, name, url, types } = req.body;
    if (!id || !name || !url || !types) {
      //localhost:3000/images/1.png
      http: return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // Kiểm tra trùng ID
    const isDuplicate = pokemons.some((p) => p.id === parseInt(id));
    if (isDuplicate) {
      return res
        .status(409)
        .json({ message: `Pokemon với ID ${id} đã tồn tại` });
    }
    const newPokemon = {
      id: parseInt(id),
      name: name.toLowerCase(),
      url,
      types: types.map((t) => t.toLowerCase()),
    };
    pokemons.push(newPokemon);

    fs.writeFileSync("db.json", JSON.stringify({ data: pokemons }, null, 2));

    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});
//delete pokemon
router.delete("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const raw = fs.readFileSync("db.json", "utf-8");
    const db = JSON.parse(raw);
    const pokemons = db.data;
    const index = pokemons.findIndex((t) => t.id === Number(id));
    if (index === -1) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy Pokémon cần xoá" });
    }
    // Xoá Pokémon theo id
    const deleted = pokemons.splice(index, 1);
    fs.writeFileSync(
      "db.json",
      JSON.stringify({ data: pokemons, page: 1, limit: 20 }, null, 2)
    );

    return res.json({
      message: `Đã xóa Pokémon ID ${id}`,
      deletedPokemon: deleted[0],
    });
  } catch (err) {
    next(err);
  }
});
//update pokemon
router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const raw = fs.readFileSync("db.json", "utf-8");
    const db = JSON.parse(raw);
    const pokemons = db.data;
    const infoUpdate = req.body;
    console.log("info", infoUpdate);
    const index = pokemons.findIndex((t) => t.id === Number(id));
    console.log("index", index);
    if (index === -1) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy Pokémon cần xoá" });
    }
    // Update Pokémon theo id
    const updated = { ...pokemons[index], ...infoUpdate };
    db.data[index] = updated;
    fs.writeFileSync(
      "db.json",
      JSON.stringify({ data: pokemons, page: 1, limit: 20 }, null, 2)
    );

    return res.json({
      updatedPokemon: updated,
    });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
