"use client";
import { Typography, Space, Input, Button, Card } from "antd";
import Link from "next/link";

const { Text } = Typography;

export default function Signin(){
  return (
    <Card
      title="Sign in with BU email"
      style={{
        width: 400,
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        textAlign: "center",
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Input placeholder="BU email" variant="filled" size="large" />
        <Input.Password placeholder="Password" variant="filled" size="large" />
        <Button type="primary" shape="round" size="large" block>
        Sign in
        </Button>
        <Space direction="horizontal" size={7}>
          <Text type="secondary"> Don&lsquo;t have an account? </Text>
          <Link href="/createAcc" style={{ color: "#1677ff", fontSize: 14 }}>
            Sign up
          </Link>
        </Space>
      </Space>
    </Card>
  );
}