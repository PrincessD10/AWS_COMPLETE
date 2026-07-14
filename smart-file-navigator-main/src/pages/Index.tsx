import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import UserDashboard from '@/components/dashboards/UserDashboard';
import ProcessingStaffDashboard from '@/components/dashboards/ProcessingStaffDashboard';
import DeputyDirectorDashboard from '@/components/dashboards/DeputyDirectorDashboard';
import { useAwsAuth } from '@/hooks/useAwsAuth';
import { FileText, Users, Shield, Zap, Cloud, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
    const [currentView, setCurrentView] = useState<'home' | 'login' | 'signup'>('home');
    const { user, loading,  signOut} = useAwsAuth();

    if (loading) {                                                                                                            
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading DocuTrack Pro...</p>
                </div>
            </div>
        );
    }

    if (user) {
        switch (user.role) {
            case 'processing-staff':
                return <ProcessingStaffDashboard user={user} onLogout={signOut} />;
            case 'deputy-director':
                return <DeputyDirectorDashboard user={user} onLogout={signOut} />;
            default:
                return <UserDashboard user={user} onLogout={signOut} />;
        }
    }

    if (currentView === 'login') {
        return <LoginForm onBack={() => setCurrentView('home')} />;
    }

    if (currentView === 'signup') {
        return <SignupForm onBack={() => setCurrentView('home')} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">DocuTrack Pro</span>
                        </div>
                        <div className="flex space-x-4">
                            <Button variant="ghost" onClick={() => setCurrentView('login')}>
                                Sign In
                            </Button>
                            <Button onClick={() => setCurrentView('signup')} className="bg-blue-600 hover:bg-blue-700">
                                Get Started
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-6">
                        <FileText className="h-16 w-16 text-blue-600" />
                        <h1 className="text-5xl font-bold text-gray-900">DocuTrack Pro</h1>
                    </div>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Professional Document Processing Platform powered by AWS Cloud Services.
                        Streamline your document workflow with intelligent processing, real-time tracking,
                        and secure cloud storage.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => setCurrentView('signup')}
                            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
                        >
                            Begin Your Journey
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setCurrentView('login')}
                            className="text-lg px-8 py-4"
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
                        <p className="text-xl text-gray-600">Everything you need to manage documents efficiently</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Cloud className="h-12 w-12 text-blue-600 mb-4" />
                                <CardTitle>AWS Cloud Integration</CardTitle>
                                <CardDescription>
                                    Secure document storage with S3, powerful Lambda processing, and reliable RDS database
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Users className="h-12 w-12 text-green-600 mb-4" />
                                <CardTitle>Multi-Role Dashboard</CardTitle>
                                <CardDescription>
                                    Customized interfaces for clients, processing staff, and deputy directors with role-based access
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Zap className="h-12 w-12 text-purple-600 mb-4" />
                                <CardTitle>Real-Time Processing</CardTitle>
                                <CardDescription>
                                    Instant document processing, notifications, and status updates powered by AWS Lambda
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <Shield className="h-12 w-12 text-red-600 mb-4" />
                                <CardTitle>Enterprise Security</CardTitle>
                                <CardDescription>
                                    Bank-level security with AWS encryption, secure authentication, and audit trails
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <FileText className="h-12 w-12 text-blue-600 mb-4" />
                                <CardTitle>Document Management</CardTitle>
                                <CardDescription>
                                    Upload, edit, version control, and download documents with full tracking capabilities
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                                <CardTitle>Analytics & Reports</CardTitle>
                                <CardDescription>
                                    Comprehensive reporting, processing analytics, and performance insights
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DocuTrack Pro?</h2>
                        <p className="text-xl text-gray-600">Built for modern businesses that value efficiency and security</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Streamlined Workflow</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">Automated document processing and routing</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">Real-time status tracking and notifications</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">Role-based access and approval workflows</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">Comprehensive audit trails and reporting</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Enterprise-Ready</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">AWS Free Tier compatible for cost efficiency</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">Scalable architecture that grows with your business</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">99.9% uptime with AWS reliability</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                                    <span className="text-gray-700">Mobile-responsive design for anywhere access</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Document Workflow?</h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of organizations already using DocuTrack Pro to streamline their operations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => setCurrentView('signup')}
                            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
                        >
                            Create Your Account
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setCurrentView('login')}
                            className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4"
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-6 w-6 text-blue-400" />
                        <span className="text-lg font-bold">DocuTrack Pro</span>
                    </div>
                    <p className="text-center text-gray-400 mt-2">
                        Professional Document Processing Platform - Powered by AWS
                    </p>
                    <p className="text-center text-gray-500 mt-4 text-sm">
                        © 2025 Awara Diana Tengwi. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Index;