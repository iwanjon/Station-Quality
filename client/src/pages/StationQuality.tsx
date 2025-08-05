// src/pages/StationQuality.tsx
import Card from '../components/Card'
import MainLayout from '../layouts/MainLayout'

const StationQuality = () => (
  <MainLayout className="flex flex-wrap justify-center items-center gap-6 p-8 bg-gray-100">
    <Card title="Station 1" description="Details about Station 1" />
    <Card title="Station 2" description="Details about Station 2" />
    <Card title="Station 3" description="Details about Station 3" />
  </MainLayout>
)

export default StationQuality
