"use client";
import {Layout} from "antd";
import AppFooter from "../components/AppFooter";

export default function SigninLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Content
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ padding: 24, minHeight: 380 }}>{children}</div>
      </Layout.Content>
      <AppFooter />
    </Layout>
  );
}
