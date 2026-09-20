import { prepareE2eDatabase } from "./prepare-db";

export default async function globalSetup() {
  await prepareE2eDatabase();
}
