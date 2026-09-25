import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
        <div>
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-gray-600 mt-2">Page not found</p>
        </div>
        <p className="text-gray-600 max-w-md">
          The page you're looking for doesn't exist. Check the URL or navigate back to the home page.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
