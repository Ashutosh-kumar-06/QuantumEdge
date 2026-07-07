"""
test_worker_logic.py
====================
Validates QuantumEdge worker source files, Dockerfiles, and requirements
purely via static file inspection (no RabbitMQ or runtime dependencies).
"""

import unittest
import os
import re

# ─── Resolve project root (two levels up from this test file) ───
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def _read(rel_path: str) -> str:
    """Read a project-relative file and return its full text."""
    full = os.path.join(PROJECT_ROOT, rel_path)
    with open(full, "r", encoding="utf-8") as f:
        return f.read()


# =====================================================================
# 1. Worker Source Validation
# =====================================================================

class TestPythonWorkerSource(unittest.TestCase):
    """Validate simulation-worker/worker.py"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("simulation-worker", "worker.py"))

    # --- imports ---
    def test_imports_pika(self):
        self.assertIn("import pika", self.src,
                       "Python worker must import pika")

    def test_imports_json(self):
        self.assertIn("import json", self.src,
                       "Python worker must import json")

    def test_imports_qiskit(self):
        self.assertTrue(
            "from qiskit" in self.src or "import qiskit" in self.src,
            "Python worker must import qiskit")

    def test_imports_qiskit_aer(self):
        self.assertTrue(
            "from qiskit_aer" in self.src or "import qiskit_aer" in self.src,
            "Python worker must import qiskit_aer")

    # --- queue ---
    def test_declares_quantum_jobs_queue(self):
        self.assertIn("queue='quantum_jobs'", self.src,
                       "Python worker must declare queue 'quantum_jobs'")

    # --- function ---
    def test_has_run_simulation_function(self):
        self.assertRegex(self.src, r"def run_simulation\(",
                         "Python worker must define run_simulation()")

    # --- circuit diagram ---
    def test_generates_circuit_diagram(self):
        self.assertIn("qc.draw('text')", self.src,
                       "Python worker must call qc.draw('text') for diagram")


class TestCppWorkerSource(unittest.TestCase):
    """Validate cpp-worker/worker.py"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("cpp-worker", "worker.py"))

    # --- imports ---
    def test_imports_subprocess(self):
        self.assertIn("import subprocess", self.src,
                       "C++ worker must import subprocess")

    def test_imports_pika(self):
        self.assertIn("import pika", self.src,
                       "C++ worker must import pika")

    def test_imports_json(self):
        self.assertIn("import json", self.src,
                       "C++ worker must import json")

    # --- queue ---
    def test_declares_cpp_jobs_queue(self):
        self.assertIn("queue='cpp_jobs'", self.src,
                       "C++ worker must declare queue 'cpp_jobs'")

    # --- function ---
    def test_has_run_cpp_code_function(self):
        self.assertRegex(self.src, r"def run_cpp_code\(",
                         "C++ worker must define run_cpp_code()")

    # --- g++ + QuEST ---
    def test_compiles_with_gpp(self):
        self.assertIn('"g++"', self.src,
                       "C++ worker must compile with g++")

    def test_links_quest(self):
        self.assertTrue(
            "-lQuEST" in self.src or "QuEST" in self.src,
            "C++ worker must link the QuEST library")

    # --- timeouts ---
    def test_compile_timeout_15s(self):
        # Look for timeout=15 on the compile subprocess call
        compile_section = self.src[:self.src.index("# Execute")]
        self.assertIn("timeout=15", compile_section,
                       "C++ worker must have 15s compile timeout")

    def test_exec_timeout_10s(self):
        exec_section = self.src[self.src.index("# Execute"):]
        self.assertIn("timeout=10", exec_section,
                       "C++ worker must have 10s execution timeout")


# =====================================================================
# 2. Dockerfile Validation
# =====================================================================

class TestPythonWorkerDockerfile(unittest.TestCase):
    """Validate simulation-worker/Dockerfile"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("simulation-worker", "Dockerfile"))

    def test_base_image_python310_slim(self):
        self.assertIn("python:3.10-slim", self.src,
                       "Python worker Dockerfile must use python:3.10-slim")


class TestCppWorkerDockerfile(unittest.TestCase):
    """Validate cpp-worker/Dockerfile"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("cpp-worker", "Dockerfile"))

    def test_installs_gpp(self):
        self.assertIn("g++", self.src,
                       "C++ Dockerfile must install g++")

    def test_installs_cmake(self):
        self.assertIn("cmake", self.src,
                       "C++ Dockerfile must install cmake")

    def test_installs_curl(self):
        self.assertIn("curl", self.src,
                       "C++ Dockerfile must install curl")

    def test_downloads_quest_tarball(self):
        self.assertTrue(
            "tar.gz" in self.src or "tarball" in self.src,
            "C++ Dockerfile must download QuEST as a tarball (.tar.gz)")


class TestApiGatewayDockerfile(unittest.TestCase):
    """Validate api-gateway/Dockerfile"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("api-gateway", "Dockerfile"))

    def test_base_image_node18_alpine(self):
        self.assertIn("node:18-alpine", self.src,
                       "API gateway Dockerfile must use node:18-alpine")


class TestFrontendDockerfile(unittest.TestCase):
    """Validate frontend/Dockerfile"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("frontend", "Dockerfile"))

    def test_base_image_node18_alpine(self):
        self.assertIn("node:18-alpine", self.src,
                       "Frontend Dockerfile must use node:18-alpine")


# =====================================================================
# 3. Requirements Validation
# =====================================================================

class TestPythonWorkerRequirements(unittest.TestCase):
    """Validate simulation-worker/requirements.txt"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("simulation-worker", "requirements.txt"))
        cls.lines = [l.strip() for l in cls.src.splitlines() if l.strip()]

    def _has_dep(self, name: str, min_version: str) -> bool:
        """Check that a dependency with >= min_version exists."""
        for line in self.lines:
            if line.startswith(name):
                match = re.search(r">=\s*([\d.]+)", line)
                if match and match.group(1) == min_version:
                    return True
        return False

    def test_requires_qiskit(self):
        self.assertTrue(self._has_dep("qiskit", "1.0.0"),
                        "Must require qiskit>=1.0.0")

    def test_requires_qiskit_aer(self):
        self.assertTrue(self._has_dep("qiskit-aer", "0.14.0"),
                        "Must require qiskit-aer>=0.14.0")

    def test_requires_pika(self):
        self.assertTrue(self._has_dep("pika", "1.3.0"),
                        "Must require pika>=1.3.0")


class TestCppWorkerRequirements(unittest.TestCase):
    """Validate cpp-worker/requirements.txt"""

    @classmethod
    def setUpClass(cls):
        cls.src = _read(os.path.join("cpp-worker", "requirements.txt"))
        cls.lines = [l.strip() for l in cls.src.splitlines() if l.strip()]

    def _has_dep(self, name: str, min_version: str) -> bool:
        for line in self.lines:
            if line.startswith(name):
                match = re.search(r">=\s*([\d.]+)", line)
                if match and match.group(1) == min_version:
                    return True
        return False

    def test_requires_pika(self):
        self.assertTrue(self._has_dep("pika", "1.3.0"),
                        "Must require pika>=1.3.0")


# =====================================================================
if __name__ == "__main__":
    unittest.main(verbosity=2)
