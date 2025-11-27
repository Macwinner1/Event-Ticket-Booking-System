exports.up = function(knex) {
  return knex.schema.createTable('waiting_list', (table) => {
    table.string('id', 36).primary();
    table.string('event_id', 36).notNullable();
    table.string('user_id', 255).notNullable();
    table.string('user_name', 255).notNullable();
    table.string('user_email', 255).notNullable();
    table.integer('position').notNullable();
    table.timestamp('added_at').defaultTo(knex.fn.now());
    
    table.foreign('event_id').references('events.id');
    table.index(['event_id', 'position'], 'idx_event_position');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('waiting_list');
};
