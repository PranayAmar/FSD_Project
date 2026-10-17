import { Router } from "express";
import passport from "passport";
import crypto from "crypto";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/",
  }),
  async (req, res) => {
    try {
      const token = crypto.randomBytes(20).toString("hex");

      if (!req.user) {
        return res.redirect("http://localhost:5173/");
      }

      req.user.token = token;

      await req.user.save();

      return res.redirect(`http://localhost:5173/auth-success?token=${token}`);
    } catch (err) {
      console.log(err);

      res.redirect("http://localhost:5173/");
    }
  },
);

export default router;
