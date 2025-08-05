import { NextAuthOptions } from "next-auth";
import  CredentialsProvider  from "next-auth/providers/credentials";
import { connectDb } from "./dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions= {
    providers: [
        CredentialsProvider({
            name: "OTPLogin",
            credentials: {
                identifier: { label: "Email or Phone", type: "text" },
            },
            async authorize(credentials) {
                const { identifier } = credentials;

                if (!identifier) {
                throw new Error("Missing identifier");
                }

                await connectDb();

                const user = await User.findOne({
                $or: [{ email: identifier }, { phone: identifier }]
                });

                if (!user) {
                throw new Error("User not found");
                }

                // No password check — assume OTP was verified earlier
                return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                };
            }
        })

    ],
    callbacks: {
        async jwt({token, user}) {
            if(user) {
                token.id = user.id;
                token.name = user.name
            }

            return token
        },
        async session({session, token}){
            
            if(session.user) {
                session.user.id = token.id
                session.user.name = token.name
            }
            
            
            return session
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 *60 *60
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login"
    }
}