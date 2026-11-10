"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError?: () => void;
}

/** Keeps a failing 3D scene from taking the page down with it. */
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
