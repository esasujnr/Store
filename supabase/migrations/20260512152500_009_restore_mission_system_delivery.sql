-- Restore made-to-order delivery for mission systems that are produced or sourced after confirmation.

update products
set delivery_type = 'made_to_order'
where slug = 'missionwinch-500-payload-release-system';
