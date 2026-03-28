import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.warn('ErrorBoundary', error?.message, info?.componentStack);
    }

    handleReset = () => this.setState({ error: null });

    render() {
        if (this.state.error) {
            return (
                <View style={styles.wrap}>
                    <Text style={styles.title}>Something gentle went wrong</Text>
                    <Text style={styles.body}>The app hit an unexpected snag. Your data should be safe — try again.</Text>
                    <TouchableOpacity style={styles.btn} onPress={this.handleReset} accessibilityRole="button">
                        <Text style={styles.btnText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.dark.background,
    },
    title: {
        ...theme.typography.h2,
        color: theme.dark.textMain,
        marginBottom: theme.spacing.md,
    },
    body: {
        ...theme.typography.body,
        color: theme.dark.textSub,
        marginBottom: theme.spacing.xl,
    },
    btn: {
        backgroundColor: theme.colors.secondary,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontFamily: theme.fontFamily.bodySemi,
        fontWeight: '600',
    },
});
