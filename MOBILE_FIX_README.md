Module not found: Can't resolve '../../../config/api'

./src/app/admin/tenants/[tenantId]/page.js (8:1)

Module not found: Can't resolve '../../../config/api'
   6 | import axios from 'axios';
   7 | import { jwtDecode } from 'jwt-decode';
>  8 | import { API_BASE_URL } from '../../../config/api';
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   9 |
  10 | export default function TenantDetailPage() {
  11 |   const router = useRouter();

https://nextjs.org/docs/messages/module-not-found