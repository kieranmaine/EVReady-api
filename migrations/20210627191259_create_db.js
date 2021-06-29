exports.up = async function (knex) {
  await knex.schema.createTable("journeys", function (table) {
    table.increments("id").primary().notNullable();
    table.dateTime("startDate").notNullable();
    table.integer("durationSeconds").notNullable();
    table.integer("distanceMeters").notNullable();
    table.boolean("finishedAtHome").notNullable();
  });

  await knex.schema.createTable("evs", function (table) {
    table.text("make").notNullable();
    table.text("model").notNullable();
    table.integer("range").notNullable();
    table.integer("price").notNullable();
    table.integer("efficiency").notNullable();
    table.primary(["make", "model"]);
  });

  const evs = [
    ["Honda", "e", 137, 27489, 275],
    ["Nissan", "Leaf", 133, 28923, 255],
    ["Peugeot", "e-2008 SUV", 193, 28999, 295],
    ["Porsche", "Taycan Turbo", 237, 113098, 345],
    ["Renault", "Zoe ZE50 R110", 245, 26230, 235],
    ["Smart", "EQ forfour", 55, 17389, 305],
    ["Tesla", "Model 3 Standard Range Plus", 267, 41932, 234],
    ["Volkswagen", "e-Golf", 144, 27123, 273],
    ["Volkswagen", "ID.3 Pure", 205, 25123, 223],
  ].map((values) => ({
    make: values[0],
    model: values[1],
    range: values[2],
    price: values[3],
    efficiency: values[4],
  }));

  await knex("evs").insert(evs);
};

exports.down = async function (knex) {
  await knex.schema.dropTable("evs");
  await knex.schema.dropTable("journeys");
};
