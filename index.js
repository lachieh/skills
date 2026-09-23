import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const agent = JSON.parse(readFileSync(new URL("./agent.json", import.meta.url), "utf8"));
const skills = JSON.parse(readFileSync(new URL("./skills.json", import.meta.url), "utf8"));

export default {
  id: "lachie-skills",
  async setup(ctx) {
    await ctx.agent.transform((draft) => {
      draft.update(agent.name, (item) => {
        item.description = agent.description;
        item.system = agent.system;
        item.mode = "primary";
      });
    });
    await ctx.skill.transform((draft) => {
      for (const skill of skills) {
        const { location, ...definition } = skill;
        draft.add({ ...definition, path: fileURLToPath(new URL(location, import.meta.url)) });
      }
    });
  },
};
