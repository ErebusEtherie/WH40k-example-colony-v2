"""Integration tests for pagination and filtering on list endpoints.

These tests use isolated colonies to avoid fixture conflicts when testing
pagination and filtering with multiple items.
"""

import pytest
from fastapi.testclient import TestClient


class TestInfrastructurePaginationAndFiltering:
    """Tests for infrastructure pagination and filters."""

    def test_list_infrastructure_pagination(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Test", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i in range(25):
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json={"name": f"Infra {i}", "infrastructure_type": "power_network", "state": "working"})
        response = auth_client.get(f"/api/v1/colonies/{colony_id}/infrastructure")
        data = response.json()
        assert len(data["items"]) == 20, f"Expected 20 items, got {len(data['items'])}"
        assert data["meta"]["total"] == 25, f"Expected total=25, got {data['meta']['total']}"
        assert data["meta"]["has_more"] is True

    def test_list_infrastructure_pagination_edge_cases(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Edge", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i in range(10):
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json={"name": f"Infra {i}", "infrastructure_type": "power_network", "state": "working"})
        response = auth_client.get(f"/api/v1/colonies/{colony_id}/infrastructure?limit=10")
        data = response.json()
        assert len(data["items"]) == 10, f"Expected 10 items, got {len(data['items'])}"
        assert data["meta"]["has_more"] is False

    def test_list_infrastructure_filter_by_state(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "State", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i, state in enumerate(["working", "planned", "in_progress", "needed", "not_working"]):
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json={"name": f"Infra {i}", "infrastructure_type": "power_network", "state": state})
        response = auth_client.get(f"/api/v1/colonies/{colony_id}/infrastructure?state=working")
        data = response.json()
        assert len(data["items"]) == 1, f"Expected 1 working item, got {len(data['items'])}"
        assert data["items"][0]["state"] == "working"

    def test_list_infrastructure_filter_by_type(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Type", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i, itype in enumerate(["transport", "power_network", "housing", "life_support", "defense", "production"]):
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json={"name": f"Infra {i}", "infrastructure_type": itype, "state": "working"})
        response = auth_client.get(f"/api/v1/colonies/{colony_id}/infrastructure?type=power_network")
        data = response.json()
        assert len(data["items"]) == 1, f"Expected 1 power_network item, got {len(data['items'])}"
        assert data["items"][0]["infrastructure_type"] == "power_network"

    def test_list_infrastructure_combined_filters(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Combined", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        test_data = [
            {"name": "Power Grid A", "infrastructure_type": "power_network", "state": "working"},
            {"name": "Power Grid B", "infrastructure_type": "power_network", "state": "planned"},
            {"name": "Transport Hub", "infrastructure_type": "transport", "state": "working"},
        ]
        for item in test_data:
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json=item)
        response = auth_client.get(f"/api/v1/colonies/{colony_id}/infrastructure?type=power_network&state=working")
        data = response.json()
        assert len(data["items"]) == 1, f"Expected 1 item, got {len(data['items'])}"
        assert data["items"][0]["name"] == "Power Grid A"

    def test_list_infrastructure_filter_by_search(self, auth_client: TestClient):
        """Test filtering infrastructure by name search."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Search", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        test_data = [
            {"name": "Power Grid Alpha", "infrastructure_type": "power_network", "state": "working"},
            {"name": "Defense Network", "infrastructure_type": "defense", "state": "working"},
            {"name": "Transport Hub", "infrastructure_type": "transport", "state": "working"},
            {"name": "Housing Complex", "infrastructure_type": "housing", "state": "working"},
            {"name": "Medical Facility", "infrastructure_type": "life_support", "state": "working"},
        ]
        for item in test_data:
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json=item)
        response = auth_client.get(f"/api/v1/colonies/{colony_id}/infrastructure?name_search=power")
        data = response.json()
        power_items = [item for item in data["items"] if "Power" in item["name"]]
        assert len(power_items) >= 1, "Expected at least one item with 'Power' in name"

    def test_list_infrastructure_filters_with_pagination(self, auth_client: TestClient):
        """Test combining filters with pagination."""
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "FilterPag", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i in range(15):
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json={"name": f"Power Grid {i}", "infrastructure_type": "power_network", "state": "working"})
        for i in range(10):
            auth_client.post(f"/api/v1/colonies/{colony_id}/infrastructure", json={"name": f"Other {i}", "infrastructure_type": "transport", "state": "working"})
        response = auth_client.get(f"/api/v1/colonies/{colony_id}/infrastructure?type=power_network&limit=5")
        data = response.json()
        assert len(data["items"]) == 5, f"Expected 5 items, got {len(data['items'])}"
        assert data["meta"]["total"] == 15, f"Expected total=15, got {data['meta']['total']}"
        assert data["meta"]["has_more"] is True


class TestDevelopmentPlansPaginationAndFiltering:
    """Tests for development plans pagination and filters."""

    def test_list_development_plans_pagination(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Test", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i in range(25):
            auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json={"upgrade_type": "infrastructure", "target_name": f"Plan {i}", "priority": 3, "description": f"Desc {i}", "target_type": "Infrastructure"})
        response = auth_client.get(f"/api/v1/development-plans/colonies/{colony_id}")
        data = response.json()
        assert len(data["items"]) == 20, f"Expected 20 items, got {len(data['items'])}"
        assert data["meta"]["total"] == 25, f"Expected total=25, got {data['meta']['total']}"
        assert data["meta"]["has_more"] is True

    def test_list_development_plans_filter_by_status(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Status", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i in range(3):
            auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json={"upgrade_type": "infrastructure", "target_name": f"Plan {i}", "priority": 3, "description": f"Desc {i}", "target_type": "Infrastructure"})
        response = auth_client.get(f"/api/v1/development-plans/colonies/{colony_id}?status=planned")
        data = response.json()
        assert len(data["items"]) == 3, f"Expected 3 planned items, got {len(data['items'])}"
        assert all(p["status"] == "planned" for p in data["items"])

    def test_list_development_plans_filter_by_upgrade_type(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Type", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for i, utype in enumerate(["infrastructure", "support_upgrade"]):
            auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json={"upgrade_type": utype, "target_name": f"Plan {i}", "priority": 3, "description": f"Desc {i}", "target_type": "Infrastructure"})
        response = auth_client.get(f"/api/v1/development-plans/colonies/{colony_id}?upgrade_type=infrastructure")
        data = response.json()
        assert len(data["items"]) == 1, f"Expected 1 infrastructure item, got {len(data['items'])}"
        assert data["items"][0]["upgrade_type"] == "infrastructure"

    def test_list_development_plans_filter_by_priority(self, auth_client: TestClient):
        colony_response = auth_client.post("/api/v1/colonies", json={"name": "Priority", "founder_name": "Owner", "colony_type": "mining_and_industry"})
        colony_id = colony_response.json()["id"]
        for priority in [1, 2, 3, 4, 5]:
            auth_client.post(f"/api/v1/development-plans/colonies/{colony_id}", json={"upgrade_type": "infrastructure", "target_name": f"Plan {priority}", "priority": priority, "description": f"Desc {priority}", "target_type": "Infrastructure"})
        response = auth_client.get(f"/api/v1/development-plans/colonies/{colony_id}?priority=1")
        data = response.json()
        assert len(data["items"]) == 1, f"Expected 1 priority=1 item, got {len(data['items'])}"
        assert data["items"][0]["priority"] == 1

    def test_list_development_plans_filter_by_search(self, auth_client: TestClient):
        colony_response = auth_client.post('/api/v1/colonies', json={'name': 'Search', 'founder_name': 'Owner', 'colony_type': 'mining_and_industry'})
        colony_id = colony_response.json()['id']
        for name in ['Power Grid Expansion', 'Defense Network', 'Transport Hub', 'Housing Complex', 'Medical Facility']:
            auth_client.post(f'/api/v1/development-plans/colonies/{colony_id}', json={'upgrade_type': 'infrastructure', 'target_name': name, 'priority': 3, 'description': f'Desc for {name}', 'target_type': 'Infrastructure'})
        response = auth_client.get(f'/api/v1/development-plans/colonies/{colony_id}?name_search=power')
        data = response.json()
        power_items = [item for item in data['items'] if 'Power' in item['target_name']]
        assert len(power_items) >= 1, 'Expected at least one item with Power in name'

    def test_list_development_plans_combined_filters(self, auth_client: TestClient):
        colony_response = auth_client.post('/api/v1/colonies', json={'name': 'Combined', 'founder_name': 'Owner', 'colony_type': 'mining_and_industry'})
        colony_id = colony_response.json()['id']
        test_data = [
            {'upgrade_type': 'infrastructure', 'target_name': 'Power Grid A', 'priority': 1, 'description': 'Test', 'target_type': 'Infrastructure'},
            {'upgrade_type': 'infrastructure', 'target_name': 'Power Grid B', 'priority': 2, 'description': 'Test', 'target_type': 'Infrastructure'},
            {'upgrade_type': 'support_upgrade', 'target_name': 'Arbites Precinct', 'priority': 1, 'description': 'Test', 'target_type': 'Support Upgrade'},
        ]
        for item in test_data:
            auth_client.post(f'/api/v1/development-plans/colonies/{colony_id}', json=item)
        response = auth_client.get(f'/api/v1/development-plans/colonies/{colony_id}?upgrade_type=infrastructure&priority=1')
        data = response.json()
        assert len(data['items']) == 1, f"Expected 1 item, got {len(data['items'])}"
        assert data['items'][0]['target_name'] == 'Power Grid A'

    def test_list_development_plans_filters_with_pagination(self, auth_client: TestClient):
        colony_response = auth_client.post('/api/v1/colonies', json={'name': 'FilterPag', 'founder_name': 'Owner', 'colony_type': 'mining_and_industry'})
        colony_id = colony_response.json()['id']
        for i in range(15):
            auth_client.post(f'/api/v1/development-plans/colonies/{colony_id}', json={'upgrade_type': 'infrastructure', 'target_name': f'Plan {i}', 'priority': 3, 'description': f'Desc {i}', 'target_type': 'Infrastructure'})
        for i in range(10):
            auth_client.post(f'/api/v1/development-plans/colonies/{colony_id}', json={'upgrade_type': 'support_upgrade', 'target_name': f'Other {i}', 'priority': 2, 'description': f'Desc {i}', 'target_type': 'Support Upgrade'})
        response = auth_client.get(f'/api/v1/development-plans/colonies/{colony_id}?upgrade_type=infrastructure&limit=5')
        data = response.json()
        assert len(data['items']) == 5, f"Expected 5 items, got {len(data['items'])}"
        assert data['meta']['total'] == 15, f"Expected total=15, got {data['meta']['total']}"
        assert data['meta']['has_more'] is True
