"use client";
import { Space, Input, Card } from "antd";
import Link from "next/link";

export default function Signin(){
  return (
    <div className="flex flex-col justify-center items-center min-h-screen text-white">
      <Card
      className="!bg-buRed"
      title= <h1 className="!text-white">Sign in with BU email</h1>
      style={{
        width: 400,
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        textAlign: "center",
      }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Input className="!bg-white" placeholder="BU email" variant="filled" size="large" />
          <Input.Password className="!bg-white" placeholder="Password" variant="filled" size="large" />
          <button type="submit" className=" bg-white text-buRed font-bold py-2 px-4 rounded-3xl hover:bg-gray-200 min-w-full">
             Sign in
          </button>
          <Space direction="horizontal" size={7}>
            <Link href="/createAcc" className="!text-white" style={{ fontSize: 15 }}>
              Don&lsquo;t have an account? Sign up
            </Link>
          </Space>
        </Space>
      </Card>
    </div>
  );
}