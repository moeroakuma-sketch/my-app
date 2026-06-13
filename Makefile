.PHONY: db-snapshot db-reset

db-snapshot:
	npm run db:snapshot

db-reset:
	npm run db:reset
