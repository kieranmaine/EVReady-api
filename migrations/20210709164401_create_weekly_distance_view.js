
exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE VIEW WeeklyDistance
    AS
    SELECT date_trunc('week', "startDate") as week, "userId", (SUM("distanceMeters") / 1609) as "weeklyDistanceMiles"
    FROM journeys
    GROUP BY date_trunc('week', "startDate"), "userId"
    `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`DROP VIEW WeeklyDistance`);
};
