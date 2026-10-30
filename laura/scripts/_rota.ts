import { readFileSync } from "fs";
import { parseRotaImage } from "@/lib/rota";
import { friendlyDateTime } from "@/lib/booking-links";
parseRotaImage(readFileSync(process.argv[2]).toString("base64"), "image/jpeg").then((r) => console.log(r.length + " shifts\n" + r.map((x) => friendlyDateTime(new Date(x.startAt)) + " → " + friendlyDateTime(new Date(x.endAt)) + " | " + x.colleagues).join("\n"))).catch((e) => console.log("ERR", String(e).slice(0, 300)));
