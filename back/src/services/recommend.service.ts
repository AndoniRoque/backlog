import { prisma } from "../prisma";

export async function getRandomGameFromBacklog() {
   const count = await prisma.game.count({
      where: {status: "BACKLOG"}
   })

   if (count === 0 ) return null; 

   const randomIndex = Math.floor(Math.random() * count);

   const randomGame = await prisma.game.findFirst({
      where: {"status": "BACKLOG"},
      skip: randomIndex,
   })

   return randomGame
}