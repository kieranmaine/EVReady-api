
exports.up = async function (knex) {
  await knex.schema.createTable("users", function (table) {
    table.uuid("id").primary().notNullable();
  });

  await knex.schema.table("journeys", function (table) {
    table.uuid("userId").notNullable();
    table.foreign("userId").references("users.id");
  });

  await knex("users").insert({ id: "e64b7281-18ab-4d27-b788-b38300e950e1" });
};

exports.down = async function (knex) {
  await knex.schema.dropTable("users");
  await knex.schema.table("journeys").dropColumn("userId");
};
