exports.up = function(knex) {
  return knex.schema.createTable('bookings', (table) => {
    table.string('id', 36).primary();
    table.string('event_id', 36).notNullable();
    table.string('user_id', 255).notNullable();
    table.string('user_name', 255).notNullable();
    table.string('user_email', 255).notNullable();
    table.integer('ticket_quantity').defaultTo(1);
    table.string('status', 50).defaultTo('confirmed');
    table.timestamp('booked_at').defaultTo(knex.fn.now());
    
    table.foreign('event_id').references('events.id');
    table.index(['event_id', 'user_id'], 'idx_event_user');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bookings');
};
