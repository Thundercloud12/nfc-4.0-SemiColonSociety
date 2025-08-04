import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConect";
import User from "@/models/User";

export async function POST(request) {
    try {
        const {username, email, password} = await request.json();
    if(!email || !password || !username) {
        return NextResponse.json({
            error: "Email, Password and username is required"
        }, {status: 400})
    }

    await connectDb();
    const user = await User.findOne({email})
    if(user){
        return NextResponse.json({
            message: "User Already registered"
        }, {status: 400})
    }

    await User.create({
        username,
        email,
        password
    })
    return NextResponse.json({
        message: "User  registered"
    }, {status: 200})
    } catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Error occured at register handler"
        }, {status: 500}) 
    }

}