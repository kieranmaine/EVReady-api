
exports.up = async function (knex) {
  await knex.schema.createTable("fuelPurchases", function (table) {
    table.dateTime("purchaseDate").primary().notNullable();
    table.decimal("cost").notNullable();
    table.uuid("userId").notNullable();
    table.foreign("userId").references("users.id");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable("fuelPurchases");
};
