import { NextAuthOptions } from "next-auth";
import  CredentialsProvider  from "next-auth/providers/credentials";
import { connectDb } from "./dbConect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions= {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: {label: "username", type: "text"},
                password: {label: "Password", type: "password"}
            },
            async authorize(credentials){
                if(!credentials?.username || !credentials?.password) {
                    throw new Error("Missing username or password")
                }

                try {
                    
                   console.log("🔗 Connecting to MongoDB...");
                    await connectDb();
                    console.log("✅ DB connected");
                   const user = await User.findOne({username: credentials.username})

                   if(!user) {
                     throw new Error("User is not registered")
                   }

                   const isValid = await bcrypt.compare(credentials.password, user.password)

                   if(!isValid) {
                    throw new Error("Invalid Password")
                   }

                   return {
                    id: user._id.toString(),
                    username: user.username
                   }

                } catch (error) {
                    console.log(error)
                    throw error
                }
            }
        })
    ],
    callbacks: {
        async jwt({token, user}) {
            if(user) {
                token.id = user.id;
                token.username = user.username
            }

            return token
        },
        async session({session, token}){
            
            if(session.user) {
                session.user.id = token.id
                session.user.username = token.username
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