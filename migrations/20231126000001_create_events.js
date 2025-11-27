exports.up = function(knex) {
  return knex.schema.createTable('events', (table) => {
    table.string('id', 36).primary();
    table.string('event_name', 255).notNullable();
    table.timestamp('event_date').notNullable();
    table.integer('total_tickets').notNullable();
    table.integer('available_tickets').notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('events');
};
