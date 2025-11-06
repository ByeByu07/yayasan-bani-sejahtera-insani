import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

// function toNextJsHandler() {
//     const handler = async (request: Request) => {
//         return auth().handler(request);
//       };
//       return {
//         GET: handler,
//         POST: handler,
//     };
// }

export const { POST, GET } = toNextJsHandler(auth);