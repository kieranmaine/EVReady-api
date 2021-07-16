
exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE TYPE tariff_type AS ENUM ('singleRate', 'economy7');
    ALTER TABLE Users
    ADD COLUMN "tariffType" tariff_type,
    ADD COLUMN "tariffRatePeak" float,
    ADD COLUMN "tariffRateOffPeak" float
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`
    ALTER TABLE Users
    DROP COLUMN "tariffType",
    DROP COLUMN "tariffRatePeak",
    DROP COLUMN "tariffRateOffPeak";
    DROP TYPE tariff_type;
  `);
};
