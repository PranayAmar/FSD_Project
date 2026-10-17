import { Router } from "express";
import passport from "passport";
import crypto from "crypto";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: FRONTEND_URL,
  }),
  async (req, res) => {
    try {
      const token = crypto.randomBytes(20).toString("hex");

      if (!req.user) {
        return res.redirect(FRONTEND_URL);
      }

      req.user.token = token;

      await req.user.save();

      return res.redirect(`${FRONTEND_URL}/auth-success?token=${token}`);
    } catch (err) {
      console.log(err);

      res.redirect(FRONTEND_URL);
    }
  },
);

export default router;
