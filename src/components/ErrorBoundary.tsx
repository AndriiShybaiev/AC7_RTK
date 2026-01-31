import React, { type ErrorInfo, type ReactNode } from "react";
import logger from "../services/logging";

interface ErrorBoundaryProps {
    fallback: ReactNode;
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: Error): Partial<ErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        logger.warn(`Error capturado por ErrorBoundary: ${error.message}`);
        logger.debug(`Detalles del error: ${info.componentStack}`);
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

export default ErrorBoundary;
