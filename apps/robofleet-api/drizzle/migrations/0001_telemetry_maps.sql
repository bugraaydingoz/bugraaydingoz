CREATE TABLE IF NOT EXISTS "map_versions" (
	"map_id" text NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "map_versions_map_id_version_pk" PRIMARY KEY("map_id","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"active_version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "robot_state" (
	"robot_id" text PRIMARY KEY NOT NULL,
	"generation" integer NOT NULL,
	"sequence" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "robot_telemetry" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"robot_id" text NOT NULL,
	"generation" integer NOT NULL,
	"sequence" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "robots" ADD COLUMN "profile" jsonb;--> statement-breakpoint
ALTER TABLE "robots" ADD COLUMN "generation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "map_versions" ADD CONSTRAINT "map_versions_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "robot_state" ADD CONSTRAINT "robot_state_robot_id_robots_id_fk" FOREIGN KEY ("robot_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "robot_telemetry" ADD CONSTRAINT "robot_telemetry_robot_id_robots_id_fk" FOREIGN KEY ("robot_id") REFERENCES "public"."robots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telemetry_received_at_idx" ON "robot_telemetry" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telemetry_robot_history_idx" ON "robot_telemetry" USING btree ("robot_id","received_at","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telemetry_robot_sequence_idx" ON "robot_telemetry" USING btree ("robot_id","generation","sequence");
--> statement-breakpoint
INSERT INTO maps (id, name, active_version) VALUES ('hotel', 'Courtyard Hotel', 1);
--> statement-breakpoint
INSERT INTO map_versions (map_id, version, definition) VALUES ('hotel', 1, '{"width":2200,"depth":2200,"metresPerUnit":0.025,"viewBox":{"width":1400,"height":1000},"projection":{"x":700,"y":160,"scaleX":0.28,"scaleY":0.14},"asset":"hotel-courtyard","nodes":[[680,680],[876,680],[1196,680],[1516,680],[1520,680],[1520,876],[1520,1196],[1520,1516],[1520,1520],[1324,1520],[1004,1520],[684,1520],[680,1520],[680,1324],[680,1004],[680,684]],"edges":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,0]],"destinations":[{"name":"Room 101","point":[876,570],"node":1,"via":[]},{"name":"Room 102","point":[1196,570],"node":2,"via":[]},{"name":"Room 103","point":[1516,570],"node":3,"via":[]},{"name":"Room 104","point":[1630,876],"node":5,"via":[]},{"name":"Room 105","point":[1630,1196],"node":6,"via":[]},{"name":"Room 106","point":[1630,1516],"node":7,"via":[]},{"name":"Room 107","point":[1324,1630],"node":9,"via":[]},{"name":"Room 108","point":[1004,1630],"node":10,"via":[]},{"name":"Room 109","point":[684,1630],"node":11,"via":[]},{"name":"Room 110","point":[570,1324],"node":13,"via":[]},{"name":"Room 111","point":[570,1004],"node":14,"via":[]},{"name":"Room 112","point":[570,684],"node":15,"via":[]},{"name":"Reception","point":[515,560],"node":0,"via":[[620,680],[620,560]]},{"name":"Kitchen","point":[1640,515],"node":4,"via":[[1520,620],[1640,620]]},{"name":"Dining","point":[1685,1640],"node":8,"via":[[1580,1520],[1580,1640]]},{"name":"Robot service","point":[560,1685],"node":12,"via":[[680,1580],[560,1580]]}]}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-001','Atlas','Working','{"color":"#79bca0","mapId":"hotel","mapVersion":1,"scenario":"working","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":1520,"y":876,"heading":-28},"status":"Working","battery":84,"location":"Guest corridor","destination":"Room 104","detail":"Delivering fresh towels to a guest room.","task":{"id":"TSK-1042","title":"Delivering towels","progress":64,"remainingDistance":0,"etaSeconds":null},"route":[]}}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-002','Scout','Working','{"color":"#e9ad39","mapId":"hotel","mapVersion":1,"scenario":"working","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":1520,"y":680,"heading":60},"status":"Working","battery":72,"location":"Kitchen","destination":"Room 102","detail":"Taking a room-service order to a guest.","task":{"id":"TSK-1043","title":"Delivering room service","progress":28,"remainingDistance":0,"etaSeconds":null},"route":[]}}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-003','Nova','Charging','{"color":"#ce94b5","mapId":"hotel","mapVersion":1,"scenario":"charging","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":560,"y":1685,"heading":120},"status":"Charging","battery":36,"location":"Robot service","destination":null,"detail":"Charging at dock C-02. Ready in approximately 24 minutes.","task":null,"route":[]}}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-004','Orbit','Working','{"color":"#7d9dce","mapId":"hotel","mapVersion":1,"scenario":"working","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":1324,"y":1520,"heading":150},"status":"Working","battery":91,"location":"Guest corridor","destination":"Room 108","detail":"Taking guest amenities to a room.","task":{"id":"TSK-1045","title":"Delivering amenities","progress":12,"remainingDistance":0,"etaSeconds":null},"route":[]}}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-005','Echo','Idle','{"color":"#c2c6a7","mapId":"hotel","mapVersion":1,"scenario":"idle","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":515,"y":560,"heading":60},"status":"Idle","battery":95,"location":"Reception","destination":null,"detail":"Available and waiting for a new task.","task":null,"route":[]}}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-006','Bolt','Blocked','{"color":"#e77960","mapId":"hotel","mapVersion":1,"scenario":"blocked","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":1520,"y":1196,"heading":-28},"status":"Blocked","battery":58,"location":"Guest corridor","destination":"Room 105","detail":"An obstacle is blocking the route. Waiting for the corridor to clear.","task":{"id":"TSK-1047","title":"Delivering guest supplies","progress":42,"remainingDistance":0,"etaSeconds":null},"route":[]}}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-007','Pixel','Working','{"color":"#87b9c6","mapId":"hotel","mapVersion":1,"scenario":"working","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":680,"y":1324,"heading":150},"status":"Working","battery":67,"location":"Dining entrance","destination":"Room 110","detail":"Delivering refreshments from the dining room.","task":{"id":"TSK-1048","title":"Delivering refreshments","progress":81,"remainingDistance":0,"etaSeconds":null},"route":[]}}'::jsonb);
--> statement-breakpoint
INSERT INTO robots (id,name,status,profile) VALUES ('AMR-008','Milo','Offline','{"color":"#b5b9ad","mapId":"hotel","mapVersion":1,"scenario":"offline","initial":{"mapId":"hotel","mapVersion":1,"position":{"x":1640,"y":515,"heading":60},"status":"Idle","battery":23,"location":"Kitchen","destination":null,"detail":"Connection lost. Last seen 3 minutes ago; battery and location are last-known values.","task":null,"route":[]}}'::jsonb);
