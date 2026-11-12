-- City Vibes covers Louisville, KY only. Remove every other city.
-- Their neighborhoods go with them (on delete cascade); events that belonged
-- to a removed city are kept, with city_id set to null.

delete from cities where not (name = 'Louisville' and state_code = 'KY');