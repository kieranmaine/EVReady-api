
exports.up = async function (knex) {
  await knex.schema.alterTable("fuelPurchases", table => {
    table.dropPrimary();
    table.primary(["purchaseDate", "userId"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("fuelPurchases", table => {
    table.dropPrimary();
    table.primary(["purchaseDate"]);
  });
};
